import { Module, type DynamicModule } from '@nestjs/common';
import { PRODUCT_READ, ProductReadService } from './application/product-read.service';
import { PrismaProductReadRepository } from './infrastructure/product-read.repository';
import { ProductPublicController } from './presentation/product-public.controller';
@Module({})
export class ProductsModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return { module: ProductsModule, imports: [runtime], controllers: [ProductPublicController],
      providers: [ProductReadService,{ provide: PRODUCT_READ, useClass: PrismaProductReadRepository }] };
  }
}
