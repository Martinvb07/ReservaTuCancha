import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { Club, ClubDocument } from '../clubs/schemas/club.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { generarPasswordTemporal } from '../../common/utils/random.util';

/** Cuántos empleados puede tener un club. */
const MAX_EQUIPO = 10;

const CAMPOS = 'name email phone isActive lastLoginAt createdAt rolEquipo';

export type RolEquipo = 'encargado' | 'recepcion';

/**
 * Empleados del club: entran al panel con su propia cuenta y actúan sobre el
 * club de su dueño (ver JwtStrategy), sin tocar la cuenta de pagos ni el
 * equipo.
 */
@Injectable()
export class EquipoService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Club.name) private readonly clubModel: Model<ClubDocument>,
    private readonly notifications: NotificationsService,
  ) {}

  private filtroDelClub(ownerId: string) {
    return { role: UserRole.STAFF, clubOwnerId: new Types.ObjectId(ownerId) };
  }

  private async nombreClub(ownerId: string) {
    const club = await this.clubModel.findOne({ ownerUserId: new Types.ObjectId(ownerId) }).select('name').lean();
    return club?.name ?? 'tu club';
  }

  listar(ownerId: string) {
    return this.userModel.find(this.filtroDelClub(ownerId)).select(CAMPOS).sort({ createdAt: 1 }).lean();
  }

  async invitar(ownerId: string, datos: { name: string; email: string; phone?: string; rol?: RolEquipo }) {
    const email = datos.email.toLowerCase().trim();
    if (await this.userModel.exists({ email })) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }
    if ((await this.userModel.countDocuments(this.filtroDelClub(ownerId))) >= MAX_EQUIPO) {
      throw new BadRequestException(`El equipo admite hasta ${MAX_EQUIPO} personas`);
    }

    const clave = generarPasswordTemporal();
    const creado = await this.userModel.create({
      name: datos.name.trim(),
      email,
      phone: datos.phone?.trim(),
      role: UserRole.STAFF,
      rolEquipo: datos.rol ?? 'encargado',
      clubOwnerId: new Types.ObjectId(ownerId),
      passwordHash: await bcrypt.hash(clave, 10),
      isActive: true,
      debeCambiarClave: true,
    });

    await this.notifications.sendInvitacionEquipo({
      email, nombre: creado.name, club: await this.nombreClub(ownerId), clave, esNueva: true,
    });
    return this.userModel.findById(creado._id).select(CAMPOS).lean();
  }

  private async buscar(ownerId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Persona no encontrada');
    const persona = await this.userModel.findOne({ _id: new Types.ObjectId(id), ...this.filtroDelClub(ownerId) });
    if (!persona) throw new NotFoundException('Persona no encontrada');
    return persona;
  }

  /** Pausar o reactivar el acceso. Al pausar se corta también la sesión. */
  async cambiarAcceso(ownerId: string, id: string, activo: boolean) {
    const persona = await this.buscar(ownerId, id);
    persona.isActive = activo;
    if (!activo) persona.refreshToken = undefined;
    await persona.save();
    return this.userModel.findById(persona._id).select(CAMPOS).lean();
  }

  /** Cambia el rol. Se corta la sesión para que el permiso nuevo rija de una. */
  async cambiarRol(ownerId: string, id: string, rol: RolEquipo) {
    const persona = await this.buscar(ownerId, id);
    (persona as any).rolEquipo = rol;
    persona.refreshToken = undefined;
    await persona.save();
    return this.userModel.findById(persona._id).select(CAMPOS).lean();
  }

  async nuevaClave(ownerId: string, id: string) {
    const persona = await this.buscar(ownerId, id);
    const clave = generarPasswordTemporal();
    persona.passwordHash = await bcrypt.hash(clave, 10);
    persona.refreshToken = undefined;
    persona.debeCambiarClave = true;
    await persona.save();
    await this.notifications.sendInvitacionEquipo({
      email: persona.email, nombre: persona.name, club: await this.nombreClub(ownerId), clave, esNueva: false,
    });
    return { ok: true };
  }

  async quitar(ownerId: string, id: string) {
    const persona = await this.buscar(ownerId, id);
    await persona.deleteOne();
    return { ok: true };
  }
}
