/**
 * Represents isometric coordinates in a 3D space.
 */
export class IsometricCoordinates {
  constructor(
    public s: number,
    public e: number,
    public u: number
  ) {}

  public static fromString(coordString: string) {
    const [s, e, u] = coordString.split(",").map(Number);
    return new IsometricCoordinates(s, e, u);
  }

  public toString() {
    return `${this.s},${this.e},${this.u}`;
  }

  public add(offset: IsometricCoordinates) {
    return new IsometricCoordinates(
      this.s + offset.s,
      this.e + offset.e,
      this.u + offset.u
    );
  }
}
