import { BrandServiceController } from './brand-service.controller';
import { BrandCreateDto } from '@brand/brand/dto/brand.create.dto';
import { BrandUpdateDto } from '@brand/brand/dto/brand.update.dto';
import { BrandServiceService } from './brand-service.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('BrandServiceController', () => {
  let brand;
  let brandServiceController: BrandServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [BrandServiceController],
      providers: [BrandServiceService],
    }).compile();

    brandServiceController = app.get<BrandServiceController>(
      BrandServiceController,
    );
  });

  describe('root', () => {
    it('should be create', () => {
      const brandDto: BrandCreateDto = {
        crmList: [],
        description: '',
        name: '',
        pspList: [],
        slug: '',
        idCashier: '',
      };
      expect(
        brandServiceController.createOne(brandDto).then((createdBrand) => {
          brand = createdBrand;
        }),
      ).toHaveProperty('name', brand.name);
    });

    it('should be update', () => {
      const brandDto: BrandUpdateDto = {
        id: brand.id,
        name: 'colombia',
        description: '987654321',
      };
      expect(
        brandServiceController.updateOne(brandDto).then((updatedBrand) => {
          brand = updatedBrand;
        }),
      ).toHaveProperty('name', brandDto.name);
    });

    it('should be delete', () => {
      expect(brandServiceController.deleteOneById(brand.id)).toReturn();
    });
  });
});
