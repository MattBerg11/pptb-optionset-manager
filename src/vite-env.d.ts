/// <reference types="@pptb/types" />
/// <reference types="vite/client" />

declare module "@react-code-view/react/styles" {
    const styles: string;
    export default styles;
}

declare global {
    interface Window {
        toolboxAPI: typeof import('@pptb/types').toolboxAPI;
        dataverseAPI: typeof import('@pptb/types').dataverseAPI;
    }
}

export {};
