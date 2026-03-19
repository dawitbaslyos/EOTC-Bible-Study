package com.senay.app;

import android.content.Context;
import android.util.JsonReader;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * Streams {@code public/data/bible-content.json} from assets — one verse (paragraph mode)
 * or one full chapter (chapter mode).
 */
public final class BibleGateNavigator {

    public static final String ASSET_PATH = "public/data/bible-content.json";

    public static class Segment {
        public String title = "";
        public String subtitle = "";
        public String html = "";
    }

    private static class VerseParsed {
        int number;
        String geez = "";
        String text = "";
        String english = "";

        String toHtml() {
            StringBuilder sb = new StringBuilder();
            sb.append("<div style=\"margin-bottom:18px;\">");
            if (number > 0) {
                sb.append("<span style=\"color:#888;font-size:11px;\">").append(number).append("</span>");
            }
            if (geez != null && !geez.isEmpty()) {
                sb.append("<p style=\"font-size:17px;line-height:1.65;margin-top:6px;\">")
                        .append(esc(geez)).append("</p>");
            }
            if (text != null && !text.isEmpty()) {
                sb.append("<p style=\"color:#d4af37;font-style:italic;margin-top:8px;line-height:1.6;\">")
                        .append(esc(text)).append("</p>");
            }
            if (english != null && !english.isEmpty()) {
                sb.append("<p style=\"color:#b0b0b0;margin-top:8px;border-left:3px solid #d4af37;padding-left:12px;line-height:1.55;\">")
                        .append(esc(english)).append("</p>");
            }
            sb.append("</div>");
            return sb.toString();
        }
    }

    private BibleGateNavigator() {}

    public static boolean assetExists(Context ctx) {
        try {
            ctx.getAssets().openFd(ASSET_PATH);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean hasVerse(Context ctx, int bookIndex, int chapterIndex, int verseFlat) {
        Segment s = loadParagraph(ctx, bookIndex, chapterIndex, verseFlat);
        return s != null && s.html != null && !s.html.isEmpty();
    }

    public static boolean hasChapter(Context ctx, int bookIndex, int chapterIndex) {
        Segment s = loadChapter(ctx, bookIndex, chapterIndex);
        return s != null && s.html != null && !s.html.isEmpty();
    }

    public static Segment loadParagraph(Context ctx, int bookIndex, int chapterIndex, int verseFlat) {
        try (InputStream in = ctx.getAssets().open(ASSET_PATH);
             JsonReader r = new JsonReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            r.beginArray();
            for (int i = 0; i < bookIndex; i++) {
                if (!r.hasNext()) return null;
                skipBook(r);
            }
            if (!r.hasNext()) return null;
            return readBookForSingleVerse(r, chapterIndex, verseFlat);
        } catch (Exception e) {
            return null;
        }
    }

    public static Segment loadChapter(Context ctx, int bookIndex, int chapterIndex) {
        try (InputStream in = ctx.getAssets().open(ASSET_PATH);
             JsonReader r = new JsonReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            r.beginArray();
            for (int i = 0; i < bookIndex; i++) {
                if (!r.hasNext()) return null;
                skipBook(r);
            }
            if (!r.hasNext()) return null;
            return readBookForFullChapter(r, chapterIndex);
        } catch (Exception e) {
            return null;
        }
    }

    private static Segment readBookForSingleVerse(JsonReader r, int chapterIndex, int verseFlat) throws IOException {
        String bookName = "Scripture";
        r.beginObject();
        while (r.hasNext()) {
            String name = r.nextName();
            if ("book_name_en".equals(name)) {
                bookName = r.nextString();
            } else if ("chapters".equals(name)) {
                r.beginArray();
                for (int j = 0; j < chapterIndex; j++) {
                    if (!r.hasNext()) {
                        return null;
                    }
                    skipChapter(r);
                }
                if (!r.hasNext()) {
                    return null;
                }
                return readChapterObjectSingleVerse(r, bookName, verseFlat);
            } else {
                r.skipValue();
            }
        }
        r.endObject();
        return null;
    }

    private static Segment readBookForFullChapter(JsonReader r, int chapterIndex) throws IOException {
        String bookName = "Scripture";
        r.beginObject();
        while (r.hasNext()) {
            String name = r.nextName();
            if ("book_name_en".equals(name)) {
                bookName = r.nextString();
            } else if ("chapters".equals(name)) {
                r.beginArray();
                for (int j = 0; j < chapterIndex; j++) {
                    if (!r.hasNext()) {
                        return null;
                    }
                    skipChapter(r);
                }
                if (!r.hasNext()) {
                    return null;
                }
                return readChapterObjectFull(r, bookName);
            } else {
                r.skipValue();
            }
        }
        r.endObject();
        return null;
    }

    /**
     * If verse is found, returns immediately (remaining JSON may be unread — stream is closed by caller).
     */
    private static Segment readChapterObjectSingleVerse(JsonReader r, String bookName, int verseFlat)
            throws IOException {
        int chapterNum = 1;
        int idx = 0;
        r.beginObject();
        while (r.hasNext()) {
            String n = r.nextName();
            if ("chapter".equals(n)) {
                chapterNum = r.nextInt();
            } else if ("sections".equals(n)) {
                r.beginArray();
                while (r.hasNext()) {
                    r.beginObject();
                    while (r.hasNext()) {
                        String sn = r.nextName();
                        if ("verses".equals(sn)) {
                            r.beginArray();
                            while (r.hasNext()) {
                                if (idx == verseFlat) {
                                    VerseParsed vp = parseVerseObject(r);
                                    Segment s = new Segment();
                                    s.title = bookName;
                                    s.subtitle = "Chapter " + chapterNum + " · Verse " + vp.number;
                                    s.html = vp.toHtml();
                                    return s;
                                }
                                skipVerse(r);
                                idx++;
                            }
                            r.endArray();
                        } else {
                            r.skipValue();
                        }
                    }
                    r.endObject();
                }
                r.endArray();
            } else {
                r.skipValue();
            }
        }
        r.endObject();
        return null;
    }

    private static Segment readChapterObjectFull(JsonReader r, String bookName) throws IOException {
        int chapterNum = 1;
        StringBuilder html = new StringBuilder();
        r.beginObject();
        while (r.hasNext()) {
            String n = r.nextName();
            if ("chapter".equals(n)) {
                chapterNum = r.nextInt();
            } else if ("sections".equals(n)) {
                r.beginArray();
                while (r.hasNext()) {
                    r.beginObject();
                    while (r.hasNext()) {
                        String sn = r.nextName();
                        if ("title".equals(sn)) {
                            String t = r.nextString();
                            if (t != null && !t.isEmpty()) {
                                html.append("<h3 style=\"color:#d4af37;font-size:14px;margin-top:14px;\">")
                                        .append(esc(t)).append("</h3>");
                            }
                        } else if ("verses".equals(sn)) {
                            r.beginArray();
                            while (r.hasNext()) {
                                html.append(parseVerseObject(r).toHtml());
                            }
                            r.endArray();
                        } else {
                            r.skipValue();
                        }
                    }
                    r.endObject();
                }
                r.endArray();
            } else {
                r.skipValue();
            }
        }
        r.endObject();
        if (html.length() == 0) return null;
        Segment s = new Segment();
        s.title = bookName;
        s.subtitle = "Chapter " + chapterNum;
        s.html = html.toString();
        return s;
    }

    private static VerseParsed parseVerseObject(JsonReader r) throws IOException {
        VerseParsed v = new VerseParsed();
        r.beginObject();
        while (r.hasNext()) {
            String n = r.nextName();
            switch (n) {
                case "verse":
                    v.number = r.nextInt();
                    break;
                case "text":
                    v.text = r.nextString();
                    break;
                case "geez":
                    v.geez = r.nextString();
                    break;
                case "english":
                    v.english = r.nextString();
                    break;
                default:
                    r.skipValue();
                    break;
            }
        }
        r.endObject();
        return v;
    }

    private static void skipBook(JsonReader r) throws IOException {
        r.beginObject();
        while (r.hasNext()) {
            String n = r.nextName();
            if ("chapters".equals(n)) {
                r.beginArray();
                while (r.hasNext()) {
                    skipChapter(r);
                }
                r.endArray();
            } else {
                r.skipValue();
            }
        }
        r.endObject();
    }

    private static void skipChapter(JsonReader r) throws IOException {
        r.beginObject();
        while (r.hasNext()) {
            String n = r.nextName();
            if ("sections".equals(n)) {
                r.beginArray();
                while (r.hasNext()) {
                    skipSection(r);
                }
                r.endArray();
            } else {
                r.skipValue();
            }
        }
        r.endObject();
    }

    private static void skipSection(JsonReader r) throws IOException {
        r.beginObject();
        while (r.hasNext()) {
            String n = r.nextName();
            if ("verses".equals(n)) {
                r.beginArray();
                while (r.hasNext()) {
                    skipVerse(r);
                }
                r.endArray();
            } else {
                r.skipValue();
            }
        }
        r.endObject();
    }

    private static void skipVerse(JsonReader r) throws IOException {
        r.beginObject();
        while (r.hasNext()) {
            r.nextName();
            r.skipValue();
        }
        r.endObject();
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
