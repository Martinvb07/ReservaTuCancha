import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Solicitud } from './solicitudes.schema';
import { User } from '../users/schemas/user.schema';
import { Club } from '../clubs/schemas/club.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectModel(Solicitud.name) private solicitudModel: Model<Solicitud>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Club.name) private clubModel: Model<Club>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async crearSolicitud(data: any) {
    const solicitud = new this.solicitudModel(data);
    return solicitud.save();
  }

  async listarSolicitudes() {
    return this.solicitudModel.find().sort({ createdAt: -1 });
  }

  async aprobar(id: string, approvalData?: { name?: string; email?: string; password?: string; userId?: string; nit?: string; businessName?: string }) {
    const solicitud = await this.solicitudModel.findById(id);
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');

    // Usar datos proporcionados o generar nuevos
    const userName = approvalData?.name || `${solicitud.firstName} ${solicitud.lastName}`;
    const userEmail = approvalData?.email || solicitud.email.toLowerCase();
    const tempPassword = approvalData?.password || (Math.random().toString(36).slice(-8) + 'A1!');
    const nit = approvalData?.nit || solicitud.nit || 'N/A';
    const businessName = approvalData?.businessName || solicitud.businessName || solicitud.firstName;

    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Crear usuario owner (deja que MongoDB genere el _id)
    const user = new this.userModel({
      name: userName,
      email: userEmail,
      passwordHash,
      role: 'owner',
      phone: solicitud.phone,
      isActive: true,
    });
    const savedUser = await user.save();

    // Crear club automáticamente vinculado al usuario
    const club = new this.clubModel({
      name: businessName,
      ownerUserId: savedUser._id,
      address: solicitud.city ? `${solicitud.city}, ${solicitud.department}` : undefined,
      city: solicitud.city,
      contactEmail: userEmail,
      contactPhone: solicitud.phone,
    });
    await club.save();

    // Marcar solicitud como aprobada
    solicitud.estado = 'aprobada';
    await solicitud.save();

    // Enviar email con credenciales y datos de solicitud
    await this.notificationsService.sendApprovalEmail(
      userEmail,
      userName,
      tempPassword,
      { id: savedUser._id.toString(), nit, businessName },
    );

    return { 
      message: 'Solicitud aprobada, usuario creado y club vinculado', 
      email: userEmail,
      userId: savedUser._id,
      clubId: club._id,
    };
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