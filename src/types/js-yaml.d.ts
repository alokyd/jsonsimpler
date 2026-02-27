declare module "js-yaml" {
    export function load(yaml: string): any;
    export function dump(obj: any, options?: any): string;
}
