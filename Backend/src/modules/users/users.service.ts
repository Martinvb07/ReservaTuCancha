import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-passwordHash');
  }

  async updateLastLogin(id: string) {
    await this.userModel.findByIdAndUpdate(id, { lastLoginAt: new Date() });
  }

  async findAll() {
    return this.userModel.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
  }

  async createUser(data: { name: string; email: string; phone?: string; role: string; password: string }) {
    const exists = await this.userModel.findOne({ email: data.email.toLowerCase() });
    if (exists) throw new ConflictException('Ya existe un usuario con ese email');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = new this.userModel({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role,
      phone: data.phone,
      isActive: true,
    });
    const saved = await user.save();
    const { passwordHash: _, ...result } = saved.toObject();
    return result;
  }

  async updateUser(id: string, data: { name?: string; phone?: string; role?: string; password?: string }) {
    const update: any = {};
    if (data.name)  update.name  = data.name;
    if (data.phone) update.phone = data.phone;
    if (data.role)  update.role  = data.role;
    if (data.password) update.passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.userModel.findByIdAndUpdate(id, update, { new: true }).select('-passwordHash');
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async toggleStatus(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    user.isActive = !user.isActive;
    await user.save();
    return { id, isActive: user.isActive };
  }

  async updateSubscription(id: string, data: { plan: string; estado: string }) {
    const now = new Date();
    const update: any = {
      plan: data.plan,
      subscriptionEstado: data.estado,
    };

    if (data.estado === 'activa' && data.plan !== 'basico') {
      update.subscriptionStartedAt = now;
      update.subscriptionEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 días
    } else if (data.estado === 'trial') {
      update.subscriptionStartedAt = now;
      update.subscriptionEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // +14 días
    } else if (data.plan === 'basico') {
      update.subscriptionEndsAt = null;
    }

    const user = await this.userModel.findByIdAndUpdate(id, update, { new: true }).select('-passwordHash');
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async getMyPlan(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('name email plan subscriptionEstado subscriptionEndsAt subscriptionStartedAt')
      .lean();
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const now = new Date();
    const endsAt = user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : null;
    const daysLeft = endsAt ? Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

    return {
      plan: user.plan ?? 'basico',
      estado: user.subscriptionEstado ?? 'trial',
      endsAt: user.subscriptionEndsAt ?? null,
      startedAt: user.subscriptionStartedAt ?? null,
      daysLeft,
      isExpired: endsAt ? endsAt < now : false,
      isExpiringSoon: daysLeft !== null && daysLeft <= 7 && daysLeft > 0,
    };
  }

  async deleteUser(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return { message: 'Usuario eliminado' };
  }
}