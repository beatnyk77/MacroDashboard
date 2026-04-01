declare namespace Deno {
  export function serve(handler: (req: Request) => Promise<Response> | Response): any;
  export namespace env {
    export function get(key: string): string | undefined;
  }
}
