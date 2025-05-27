import { Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { HistoryService } from './history.service';
import { getCurrentUser } from 'src/common/decorators';

@Controller('history')
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @Get(':userId')
  async getHistory(
    @getCurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.historyService.getHistory(userId, { page, limit });
  }

  @Patch('remove/:historyId')
  async removeHistory(@Param('historyId') historyId: string) {
    return this.historyService.removeHistory(historyId);
  }

  @Delete('clearHistory/:userId')
  async clearHistory(@getCurrentUser('id') userId: string) {
    return this.historyService.clearHistory(userId);
  }
}
