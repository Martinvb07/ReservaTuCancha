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
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { plan: data.plan, subscriptionEstado: data.estado },
      { new: true },
    ).select('-passwordHash');
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async deleteUser(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return { message: 'Usuario eliminado' };
  }
}