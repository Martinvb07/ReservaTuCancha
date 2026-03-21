import { Model } from 'mongoose';
import { Changelog, ChangelogDocument } from './schemas/changelog.schema';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ChangelogService {
    private changelogModel;
    private readonly notificationsService;
    constructor(changelogModel: Model<ChangelogDocument>, notificationsService: NotificationsService);
    findAll(): Promise<(import("mongoose").FlattenMaps<ChangelogDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    create(data: {
        titulo: string;
        descripcion: string;
        version?: string;
        tag: string;
        destinatarios: string;
    }): Promise<import("mongoose").Document<unknown, {}, ChangelogDocument, {}, {}> & Changelog & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
}
