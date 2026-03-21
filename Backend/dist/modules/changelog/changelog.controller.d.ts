import { ChangelogService } from './changelog.service';
export declare class ChangelogController {
    private readonly changelogService;
    constructor(changelogService: ChangelogService);
    findAll(): Promise<(import("mongoose").FlattenMaps<import("./schemas/changelog.schema").ChangelogDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    create(body: {
        titulo: string;
        descripcion: string;
        version?: string;
        tag: string;
        destinatarios: string;
    }): Promise<import("mongoose").Document<unknown, {}, import("./schemas/changelog.schema").ChangelogDocument, {}, {}> & import("./schemas/changelog.schema").Changelog & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
}
