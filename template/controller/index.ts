import { Controller } from '../types/base';
import Response from '../service/response';

const controllers: Controller[] = [
  {
    url: '/',
    async controller(context) {
      const [response] = await context.getInjections([Response]);
      response.render({});
    },
  },
];
export default controllers;
