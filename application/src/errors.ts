export class DirectoryAccessDeclinedError extends Error {
  constructor() {
    super();
    this.name = 'DirectoryAccessDeclinedError';
  }
}

export class MasDirectoryAccessDeclinedError extends Error {
  constructor() {
    super();
    this.name = 'MasDirectoryAccessDeclinedError';
  }
}

export class UnsupportedFileError extends Error {
  constructor(message: string, opts?: ErrorOptions) {
    super(message, opts);
    this.name = 'UnsupportedFileError';
  }
}

export class RefuseOverwriteError extends Error {
  constructor() {
    super();
    this.name = 'RefuseOverwriteError';
  }
}

// export class UserFacingError extends Error {
//   constructor(message: string) {
//     super(message);
//     this.name = 'UserFacingError';
//   }
// }
