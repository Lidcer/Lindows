import { internal } from '../SystemService/ServiceHandler';
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
    if (!internal.ready) {
      internal.on('allReady', this.actualStart);
      return;
    }
    internal.removeListener('allReady', this.actualStart);
  };
}
