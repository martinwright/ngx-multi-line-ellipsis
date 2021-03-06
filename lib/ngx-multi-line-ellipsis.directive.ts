import { Directive, ElementRef, Input, AfterViewInit, Renderer2, HostListener } from '@angular/core'; 

@Directive({
  selector: "[ngxEllipsis]"
})
export class NgxMultiLineEllipsisDirective implements AfterViewInit {
  @Input() lines: number;
  private text: string;
  private width = 0;
  private element: HTMLDivElement;
  private readonly OFFSET_WIDTH = 7; // There are some cases that text overflows container

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener("window:resize", ["$event"])
  onResize() {
    if (this.width !== this.getElementWidth()) {
      this.initEllipsis();
    }
  }

  ngAfterViewInit(): void {
    this.element = this.el.nativeElement;
    this.text = (this.element.textContent || '').trim();
    this.initEllipsis();
  }

  getElementWidth(): number {
    return this.element.clientWidth - this.OFFSET_WIDTH;
  }

  initEllipsis() {

    // Get element font size
    const elementFontSize = parseInt(
      this.getCssProperty("font-size").split("px")[0],
      10
    );

    // Get element font family
    const elementFontFamily = this.getCssProperty("font-family").split(
      ","
    )[0];

    // Get element width
    this.width = this.getElementWidth();

    // Remove the element from DOM
    this.renderer.setStyle(this.element, "display", "none");

    // Create a canvas element so it'd be possiable to measure expected width
    const canvas = this.renderer.createElement("canvas");
    const canvasContext = canvas.getContext("2d");

    // Set the current font size and family for more accurate width
    canvasContext.font = `${elementFontSize}px ${elementFontFamily}`;

    // Get element original text (will be replaced in future code lines)
    const elementOriginalText = this.text;

    // Init final top element text
    let topElementTextLines = "";

    // Init final ellipsis text variable
    let ellipsisTextLine = "";

    // A flag veriable to indicate if current words num as reached
    // the required lines num (minus one)
    let hasReachedLimit = false;
    let finishLoop = false;

    // A veriable that holds current width (top element)
    let currentTopElementWidth = 0;

    // A veriable that holds last text that has only complete words in it
    // to aviod white spaces breaks
    let completeWordsText = "";

    // An array of letters (more accurate measurement by canvas method)
    const allLetters = elementOriginalText.split("");

    // Run on original text string
    for (let i = 0; i < elementOriginalText.length && !finishLoop; i++) {
      // Checks if current width is smaller than
      // the max width for line times the lines to display minus one
      if (
        currentTopElementWidth < this.width * (this.lines - 1) &&
        !hasReachedLimit
      ) {
        // Save the current text as previous text
        const previousText = topElementTextLines;

        // If the current char is 'Space' then it saves the current text
        // as it has only complete words
        if (
          elementOriginalText.charAt(i) &&
          elementOriginalText.charAt(i) === " "
        ) {
          completeWordsText = topElementTextLines;
        }

        // Add current char to current text
        topElementTextLines += elementOriginalText.charAt(i);

        // Get the new current element width
        currentTopElementWidth += canvasContext.measureText(allLetters[i])
          .width;

        if (
          elementOriginalText.charAt(i) &&
          elementOriginalText.charAt(i) === "\n"
        ) {
          currentTopElementWidth -= canvasContext.measureText(allLetters[i])
            .width;
        }

        // Checks if current width is bigger or equal to
        // the max width for line times the lines to display minus one
        if (currentTopElementWidth >= this.width * (this.lines - 1)) {
          // If the current char is 'Space' it gets
          // the previos text as the final text
          if (
            elementOriginalText.charAt(i) &&
            elementOriginalText.charAt(i) === " "
          ) {
            // Set previos text as the current element final text
            topElementTextLines = previousText;

            // Set the ellipsis text line with it's first char
            ellipsisTextLine = elementOriginalText.charAt(i);

            // Else if the current char is NOT 'Space' means there's a broken word
          } else {
            // Set the complete words text string as the element final text
            topElementTextLines = completeWordsText;

            // Get the previos text (to get the last word taht we didn't included)
            const previousTextSplitBySpaces = previousText.split(" ");
            const previosLetter =
              previousTextSplitBySpaces[previousTextSplitBySpaces.length - 1] +
              elementOriginalText.charAt(i);

            ellipsisTextLine = previosLetter;
          }

          // Set flag to true so now it'll start to fill ellipsis element
          hasReachedLimit = true;

          // Set the ellipsis text line with it's first word and current char
        }

        // Finish to fill the top element
      } else {
        // If Next char is 'Space' then saves the current string
        // as complete words string
        if (
          elementOriginalText.charAt(i + 1) &&
          elementOriginalText.charAt(i + 1) === " "
        ) {
          completeWordsText = topElementTextLines;
        }

        // Add current char to ellipsis text
        ellipsisTextLine = ellipsisTextLine + elementOriginalText.charAt(i);

        // Get the new current element width
        currentTopElementWidth += canvasContext.measureText(allLetters[i])
          .width;

        if (this.width * this.lines - currentTopElementWidth < -100) {
          finishLoop = true;
        }
      }
    }

    // Create the top element to append
    const topTextDiv = this.renderer.createElement("div");
    const topText = this.renderer.createText(topElementTextLines.trim());
    this.renderer.appendChild(topTextDiv, topText);

    // Create the ellipsis element to append
    const ellipsisDiv = this.renderer.createElement("div");
    const ellipsisText = this.renderer.createText(ellipsisTextLine.trim());

    this.renderer.setStyle(ellipsisDiv, "overflow", "hidden");
    this.renderer.setStyle(ellipsisDiv, "white-space", "nowrap");
    this.renderer.setStyle(ellipsisDiv, "text-overflow", "ellipsis");
    this.renderer.appendChild(ellipsisDiv, ellipsisText);

    // Append both elements to the original element
    this.element.innerHTML = "";
    this.renderer.appendChild(this.element, topTextDiv);
    this.renderer.appendChild(this.element, ellipsisDiv);

    this.renderer.setStyle(this.element, "display", "block");
  }

  getCssProperty(property: string) {
    return getComputedStyle(this.element, null).getPropertyValue(property);
  }
}
