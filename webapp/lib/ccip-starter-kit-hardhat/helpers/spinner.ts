export class Spinner {
  private line = { interval: 130, frames: ["-", "\\", "|", "/"] };
  private spin: any;
  private message: string = '';

  start(message: string = 'Processing') {
    this.message = message;
    
    if (!process.stdout.isTTY) {
      // Just log once when not in TTY
      console.log(`${message}...`);
      return;
    }
    
    const start = 0;
    const end = this.line.frames.length;
    let i = start;

    process.stdout.write("\x1B[?25l");

    this.spin = setInterval(() => {
      process.stdout.cursorTo(0);
      process.stdout.write(`${this.line.frames[i]} ${message}...`);
      i == end - 1 ? (i = start) : i++;
    }, this.line.interval);
  }

  stop() {
    if (!process.stdout.isTTY) return;
    
    clearInterval(this.spin);
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write("\x1B[?25h");
  }
}