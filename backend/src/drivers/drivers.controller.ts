import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('drivers')
@UseGuards(JwtAuthGuard)
export class DriversController {
  constructor(private driversService: DriversService) {}

  @Get()
  findAll() { return this.driversService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.driversService.findOne(+id); }

  @Post()
  create(@Body() body: any) { return this.driversService.create(body); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.driversService.update(+id, body); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.driversService.remove(+id); }
}
