import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Court, CourtDocument } from '../courts/schemas/court.schema';

const COURT_LIMITS: Record<string, number> = {
  basico:      1,
  pro:         5,
  empresarial: Infinity,
};

const PLAN_LABELS: Record<string, string> = {
  basico:      'Básico',
  pro:         'Pro',
  empresarial: 'Empresarial',
};

@Injectable()
export class PlanLimitsService {
  constructor(
    @InjectModel(User.name)  private userModel:  Model<UserDocument>,
    @InjectModel(Court.name) private courtModel: Model<CourtDocument>,
  ) {}

  // ── Crear cancha ──────────────────────────────────────────────────────────
  async assertCanCreateCourt(userId: string): Promise<void> {
    const user = await this.userModel
      .findById(userId)
      .select('plan subscriptionEstado subscriptionEndsAt')
      .lean();
    if (!user) throw new NotFoundException('Usuario no encontrado');

    this.assertNotExpired(user);

    const plan  = (user.plan as string) ?? 'basico';
    const limit = COURT_LIMITS[plan] ?? 1;

    if (limit !== Infinity) {
      const count = await this.courtModel.countDocuments({
        ownerId: new Types.ObjectId(userId),
      });
      if (count >= limit) {
        throw new ForbiddenException({
          code:            'COURT_LIMIT_REACHED',
          message:         `Tu plan ${PLAN_LABELS[plan] ?? plan} permite máximo ${limit} cancha${limit !== 1 ? 's' : ''}. Mejora tu plan para agregar más.`,
          currentPlan:     plan,
          limit,
          current:         count,
          upgradeRequired: true,
        });
      }
    }
  }

  // ── Configurar Wompi ──────────────────────────────────────────────────────
  async assertCanConfigureWompi(userId: string): Promise<void> {
    const user = await this.userModel
      .findById(userId)
      .select('plan subscriptionEstado subscriptionEndsAt')
      .lean();
    if (!user) throw new NotFoundException('Usuario no encontrado');

    this.assertNotExpired(user);

    const plan = (user.plan as string) ?? 'basico';
    if (plan === 'basico') {
      throw new ForbiddenException({
        code:            'WOMPI_NOT_ALLOWED',
        message:         'La configuración de Wompi requiere el Plan Pro o Empresarial.',
        currentPlan:     plan,
        upgradeRequired: true,
      });
    }
  }

  // ── Helper: suscripción vencida ───────────────────────────────────────────
  private assertNotExpired(user: any): void {
    if (user.subscriptionEstado === 'vencida') {
      throw new ForbiddenException({
        code:            'SUBSCRIPTION_EXPIRED',
        message:         'Tu suscripción ha vencido. Renueva tu plan para continuar.',
        upgradeRequired: true,
      });
    }
    if (user.subscriptionEndsAt && (user.plan as string) !== 'basico') {
      if (new Date(user.subscriptionEndsAt) < new Date()) {
        throw new ForbiddenException({
          code:            'SUBSCRIPTION_EXPIRED',
          message:         'Tu suscripción ha vencido. Renueva tu plan para continuar.',
          upgradeRequired: true,
        });
      }
    }
  }
}
