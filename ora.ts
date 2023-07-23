import App from 'express';

// interfaces
export interface Type<T> extends Function {
  new(...args: any[]): T;
}

export interface Route {
  path: string;
  requestMethod: RequestMethod;
  handler: (...args: any[]) => void;
}

export abstract class AbstractOraApplication {
  start() { }
}

// enums
export enum RequestMethod {
  GET = "get",
  POST = "post",
}

export enum ParamType {
  PATH_VARIABLE = "path_variable",
  REQUEST_PARAM = "request_param",
  REQUEST_BODY = "request_body"
}

// constants
export const APPLICATION_WATERMARK = '__application__';
export const ROUTES_METADATA = '__routes__';

// decorators
export function OraApplication(port: number) {
  return <T extends Type<any>>(Target: T) => {
    const keys = Reflect.ownKeys(Target) as string[];

    const mappings: Route[] = keys.reduce((prev, key) => {
      if (key.startsWith(ROUTES_METADATA)) {
        return prev.concat(Reflect.get(Target, key) as any);
      }
      return prev;
    }, []);

    const e = App();
    e.use(App.json());

    return class extends Target {
      constructor(...args: any[]) {
        super(...args);
        this.initializeExpressApplication();
      }

      public initializeExpressApplication() {
        mappings.forEach(({ requestMethod, path, handler }) => {
          e[requestMethod](path, (req: App.Request, res: App.Response) => {
            handler(req, res, this);
          })
        })
      }

      public start() {
        e.listen(port, () => {
          console.log(`server running at http://localhost:${port}`);
        })
      }
    }
  }
}

export function createRouteParam(paramtype: ParamType) {
  return (name?: string, options = { type: "string", default: null }) => {
    return (target: Type<any>, key: string, index: number) => {
      const fn = target[key];

      Reflect.set(
        fn,
        `${paramtype}:${index}`,
        {
          name,
          index,
          ...options
        }
      );
    }
  }
}

export const Type = (type: string) => {
  return {
    type,
    default: type === "string" ? "" : null
  }
}

export const Default = <T extends string | number>(value: T) => {
  return {
    default: value,
    type: typeof value
  }
}

export const PathVariable = createRouteParam(ParamType.PATH_VARIABLE);

export const RequestParam = createRouteParam(ParamType.REQUEST_PARAM);

export const RequestBody = createRouteParam(ParamType.REQUEST_BODY);

export function createRequestMapping(requestMethod: RequestMethod) {
  return (path: string) => {
    return <T>(target: T, key: string, dc: PropertyDescriptor) => {
      const route: Route = {
        path,
        requestMethod,
        handler: (req, res, ptr) => {
          const fn = dc.value;
          const keys = Reflect.ownKeys(fn) as string[];

          const params = keys.reduce((prev, key) => {
            const paramType = key.split(':')[0];
            if (paramType === "name" || paramType === "length") {
              return prev;
            }

            const p = Reflect.get(dc.value, key);

            let recordKey = '';
            switch (paramType) {
              case ParamType.PATH_VARIABLE:
                recordKey = 'params';
                break;
              case ParamType.REQUEST_PARAM:
                recordKey = 'query';
                break;
              case ParamType.REQUEST_BODY:
                recordKey = 'body';
                break;
            }

            let value: any;
            if (p.name) {
              value = req[recordKey][p.name] ?? p.default;
            } else {
              value = req[recordKey];
            }
            prev[p.index] = p.type === "string" ? value : parseInt(value);
            return prev;
          }, [] as unknown[]);

          res.send(
            JSON.stringify(dc.value.apply(ptr, params)) // ensure 'dc' method is bound upon 'ptr' (this)
          );
        }
      };

      Reflect.set(
        target.constructor,
        `${ROUTES_METADATA}:${key}`,
        route
      )
    }
  }
}

export const GetMapping = createRequestMapping(RequestMethod.GET);

export const PostMapping = createRequestMapping(RequestMethod.POST);
