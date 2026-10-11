import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { ListPortfoliosQueryDto } from './dto/list-portfolios-query.dto';
import { PortfoliosService, PortfolioWithLatestOrder } from './portfolios.service';

@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Get()
  findAll(@Query() query: ListPortfoliosQueryDto): Promise<PortfolioWithLatestOrder[]> {
    return this.portfoliosService.findAllByCustomer(query.customerId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PortfolioWithLatestOrder> {
    return this.portfoliosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePortfolioDto): Promise<PortfolioWithLatestOrder> {
    return this.portfoliosService.create(dto);
  }
}
