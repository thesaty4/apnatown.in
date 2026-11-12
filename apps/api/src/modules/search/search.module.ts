import { Module, type DynamicModule } from '@nestjs/common';
import { SearchHomeService } from './application/search-home.service';
import { SearchHomeController } from './presentation/search-home.controller';

/** Public discovery composition. Reads owner modules only through their ports. */
@Module({})
export class SearchModule {
  static forRoot(
    runtime: DynamicModule,
    catalog: DynamicModule,
  ): DynamicModule {
    return {
      module: SearchModule,
      imports: [runtime, catalog],
      controllers: [SearchHomeController],
      providers: [SearchHomeService],
    };
  }
}
