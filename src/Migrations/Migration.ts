
/**
 * Base Migration class
 */
export abstract class Migration {
    /**
     * Run the migrations.
     */
    public abstract up(): Promise<void>;

    /**
     * Reverse the migrations.
     */
    public abstract down(): Promise<void>;
}
