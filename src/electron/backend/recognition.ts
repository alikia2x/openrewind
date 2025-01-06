type RecognitionResult = RecognitionLine[];
type Pixels = number;
type OriginX = Pixels;
type OriginY = Pixels;
type Width = Pixels;
type Height = Pixels;
type Coordinates = [OriginX, OriginY, Width, Height];

interface RecognitionLine {
    text: string;
    confidence?: number | number[];
    position?: Coordinates;
}