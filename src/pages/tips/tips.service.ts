import { Injectable } from "@nestjs/common";
import type { TipsInput } from "./tips.input";

@Injectable()
export class TipsService {
    async getTipsPage(query: TipsInput): Promise<any> {
        const { restraunt, waiter } = query;
        return `
        <html>
        <head>
        <title>Tips</title>
        </head>
        <body>
        <h1>Tips</h1>
        <div>
        restraunt:${restraunt}
        waiter:${waiter}
        </div>
        </body>
        </html>
        `;
    }
}