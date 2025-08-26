import { Test, TestingModule } from '@nestjs/testing';
import { StripController } from './strip.controller';

describe('StripController', () => {
  let controller: StripController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripController],
    }).compile();

    controller = module.get<StripController>(StripController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
