import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Solicitud } from './solicitudes.schema';
import { User } from '../users/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectModel(Solicitud.name) private solicitudModel: Model<Solicitud>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async crearSolicitud(data: any) {
    const solicitud = new this.solicitudModel(data);
    return solicitud.save();
  }

  async listarSolicitudes() {
    return this.solicitudModel.find().sort({ createdAt: -1 });
  }

  async aprobar(id: string) {
    const solicitud = await this.solicitudModel.findById(id);
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');

    // Generar contraseña temporal
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Crear usuario owner
    const user = new this.userModel({
      name: `${solicitud.firstName} ${solicitud.lastName}`,
      email: solicitud.email.toLowerCase(),
      passwordHash,
      role: 'owner',
      phone: solicitud.phone,
      isActive: true,
    });
    await user.save();

    // Marcar solicitud como aprobada
    solicitud.estado = 'aprobada';
    await solicitud.save();

    // Enviar email con credenciales
    await this.notificationsService.sendApprovalEmail(
      solicitud.email,
      `${solicitud.firstName} ${solicitud.lastName}`,
      tempPassword,
    );

    return { message: 'Solicitud aprobada y credenciales enviadas', email: solicitud.email };
  }

  async rechazar(id: string) {
    const solicitud = await this.solicitudModel.findById(id);
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');

    solicitud.estado = 'rechazada';
    await solicitud.save();

    // Notificar al solicitante
    await this.notificationsService.sendRejectionEmail(
      solicitud.email,
      `${solicitud.firstName} ${solicitud.lastName}`,
    );

    return { message: 'Solicitud rechazada' };
  }

  async reenviarCredenciales(id: string) {
    const solicitud = await this.solicitudModel.findById(id);
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    if (solicitud.estado !== 'aprobada')
      throw new NotFoundException('La solicitud no está aprobada');

    // Generar nueva contraseña temporal
    const tempPassword = Math.random().toString(36).slice(-8) + 'B2!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Actualizar contraseña del usuario
    await this.userModel.findOneAndUpdate(
      { email: solicitud.email.toLowerCase() },
      { passwordHash },
    );

    await this.notificationsService.sendApprovalEmail(
      solicitud.email,
      `${solicitud.firstName} ${solicitud.lastName}`,
      tempPassword,
    );

    return { message: 'Credenciales reenviadas' };
  }
}