import { services } from '../SystemService/ServiceHandler';
import { BaseService } from './BaseService';
import { EventEmitter } from 'events';

export class TemplateService extends BaseService {
  private SERVICE_NAME = 'template';
  private eventEmitter = new EventEmitter();

  start = () => {
    this.actualStart();
  };

  destroy() {
    this.eventEmitter.removeAllListeners();
  }
  actualStart = async () => {
    if (!services.ready) {
      services.on('allReady', this.actualStart);
      return;
    }
    services.removeListener('allReady', this.actualStart);
  };
}
