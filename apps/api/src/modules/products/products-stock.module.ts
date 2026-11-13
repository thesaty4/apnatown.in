import { Module, type DynamicModule } from '@nestjs/common';
import { PRODUCT_STOCK } from './application/product-stock-port';
import { PrismaProductStockRepository } from './infrastructure/product-stock.repository';

/** Exposes only the trusted Products stock port to Orders. */
@Module({})
export class ProductsStockModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: ProductsStockModule,
      imports: [runtime],
      providers: [{ provide: PRODUCT_STOCK, useClass: PrismaProductStockRepository }],
      exports: [PRODUCT_STOCK],
    };
  }
}
