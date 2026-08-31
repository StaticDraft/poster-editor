export {}

declare global {
  interface Window {
    electronAPI?: {
      isElectron?: boolean
      getMachineCode?: () => Promise<string>
      showSaveDialog?: (options: any) => Promise<any>
      showOpenDialog?: (options: any) => Promise<any>
      saveFile?: (options: {
        defaultPath?: string
        filters?: Array<{ name: string; extensions: string[] }>
        base64Data?: string
        textData?: string
      }) => Promise<{ canceled: boolean; filePath?: string; error?: string }>
    }
  }
}
