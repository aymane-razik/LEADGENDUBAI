import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { TenantContextInterceptor } from '../tenants/tenant-context.interceptor';
import { PropertiesApplication } from './properties.application';

@Controller('api/v2/properties')
@UseGuards(AccessTokenGuard)
@UseInterceptors(TenantContextInterceptor)
export class PropertiesController {
  constructor(private readonly properties: PropertiesApplication) {}

  @Get('areas')
  areas() {
    return this.properties.areas();
  }

  @Get('stats')
  stats() {
    return this.properties.stats();
  }

  @Get('trending')
  trending() {
    return this.properties.trending();
  }

  @Get('price-trends')
  priceTrends() {
    return this.properties.priceTrends();
  }

  @Get('similar/:id')
  similar(@Param('id') id: string) {
    return this.properties.similar(id);
  }

  @Get('search')
  search(
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('area') area?: string,
  ) {
    return this.properties.search({
      minPrice: this.optionalNumber(minPrice, 'minPrice'),
      maxPrice: this.optionalNumber(maxPrice, 'maxPrice'),
      area,
    });
  }

  @Get('nearby')
  nearby(
    @Query('lng') longitude?: string,
    @Query('lat') latitude?: string,
    @Query('maxDistance') maxDistance?: string,
  ) {
    return this.properties.nearby({
      longitude: this.requiredNumber(longitude, 'lng'),
      latitude: this.requiredNumber(latitude, 'lat'),
      maxDistance: maxDistance === undefined ? 5000 : this.requiredNumber(maxDistance, 'maxDistance'),
    });
  }

  @Get()
  list(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('type') type?: string,
    @Query('purpose') purpose?: string,
  ) {
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('page must be positive and limit must be between 1 and 100');
    }
    return this.properties.list({ page, limit, type, purpose });
  }

  @Post()
  create(@Body() input: unknown) {
    return this.properties.create(input);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.properties.getById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() input: unknown) {
    return this.properties.update(id, input);
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() input: unknown) {
    return this.properties.update(id, input);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.properties.remove(id);
  }

  private optionalNumber(value: string | undefined, name: string): number | undefined {
    if (value === undefined) return undefined;
    return this.requiredNumber(value, name);
  }

  private requiredNumber(value: string | undefined, name: string): number {
    const parsed = Number(value);
    if (value === undefined || value.trim() === '' || !Number.isFinite(parsed)) {
      throw new BadRequestException(`${name} must be a valid number`);
    }
    return parsed;
  }
}
