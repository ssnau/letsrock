import { Service } from '../types/base';
import Request from './request';
import Response from './response';

export default class Sample implements Service {
  response: Response;
  request: Request;

  _getInjections() {
    return {
      response: Response,
      request: Request,
    }
  } 
}
