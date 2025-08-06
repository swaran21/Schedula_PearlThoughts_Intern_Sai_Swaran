import { Controller, Get } from '@nestjs/common';

@Controller('hello-api')
export class HelloController {
  @Get()
  getHello(): string {
    return 'Hello from hello-api!';
  }
}