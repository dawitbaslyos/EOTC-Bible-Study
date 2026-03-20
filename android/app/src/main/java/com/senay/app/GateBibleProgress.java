package com.senay.app;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * Saved position in bible-content.json for the focus-lock reading gate.
 * Paragraph mode: each gate shows up to {@link BibleGateNavigator#PARAGRAPH_GATE_VERSE_COUNT} consecutive verses.
 * Chapter mode: full chapter at a time.
 */
public final class GateBibleProgress {
    private static final String PREFS = "senay_gate_bible_progress";
    private static final String K_BOOK = "book_index";
    private static final String K_CHAPTER = "chapter_index";
    private static final String K_VERSE = "verse_flat_index";

    private GateBibleProgress() {}

    private static SharedPreferences sp(Context ctx) {
        return ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static int getBookIndex(Context ctx) {
        return sp(ctx).getInt(K_BOOK, 0);
    }

    public static int getChapterIndex(Context ctx) {
        return sp(ctx).getInt(K_CHAPTER, 0);
    }

    public static int getVerseFlatIndex(Context ctx) {
        return sp(ctx).getInt(K_VERSE, 0);
    }

    public static void setProgress(Context ctx, int bookIndex, int chapterIndex, int verseFlatIndex) {
        sp(ctx).edit()
                .putInt(K_BOOK, bookIndex)
                .putInt(K_CHAPTER, chapterIndex)
                .putInt(K_VERSE, verseFlatIndex)
                .apply();
    }

    /**
     * After user finishes reading a chapter gate and opens the locked app.
     */
    public static void advanceChapterGate(Context ctx) {
        int b = getBookIndex(ctx);
        int c = getChapterIndex(ctx);
        if (BibleGateNavigator.hasChapter(ctx, b, c + 1)) {
            setProgress(ctx, b, c + 1, 0);
        } else if (BibleGateNavigator.hasChapter(ctx, b + 1, 0)) {
            setProgress(ctx, b + 1, 0, 0);
        } else {
            setProgress(ctx, 0, 0, 0);
        }
    }

    /**
     * After user finishes a paragraph (multi-verse) gate. {@code verseSteps} must match how many
     * verses were shown ({@link BibleGateNavigator.Segment#versesInGate}).
     */
    public static void advanceParagraphGate(Context ctx, int verseSteps) {
        if (verseSteps <= 0) {
            verseSteps = BibleGateNavigator.PARAGRAPH_GATE_VERSE_COUNT;
        }
        int bi = getBookIndex(ctx);
        int ci = getChapterIndex(ctx);
        int vi = getVerseFlatIndex(ctx);
        for (int step = 0; step < verseSteps; step++) {
            int[] next = BibleGateNavigator.nextVersePosition(ctx, bi, ci, vi);
            if (next == null) {
                setProgress(ctx, 0, 0, 0);
                return;
            }
            bi = next[0];
            ci = next[1];
            vi = next[2];
        }
        setProgress(ctx, bi, ci, vi);
    }
}
