import { Controller } from '../types/base';
import Response from '../service/response';
import Sample from '../service/sample';

const controllers: Controller[] = [
  {
    url: '/',
    async controller(context) {
      const [response] = await context.getInjections([Response]);
      response.render({});
    },
  },
  {
    url: '/sample',
    async controller(context) {
      const [sample] = await context.getInjections([Sample]);
      sample.response.ok({
        msg: 'ok'
      });
    },
  },
];
export default controllers;
