# -*- coding: utf-8 -*-
import os
import fitz  # PyMuPDF
import tkinter as tk
from tkinter import filedialog, simpledialog, messagebox
from PIL import Image, ImageTk


def normalize_path(path):
    if os.name == "nt":
        path = os.path.abspath(path)
        if not path.startswith("\\\\?\\"):
            path = "\\\\?\\" + path
    return path


class PDFReader:
    def __init__(self, root):
        self.root = root
        self.root.title("Python PDF Reader")

        self.doc = None
        self.page_index = 0
        self.zoom = 1.0
        self.search_results = []
        self.search_index = 0

        toolbar = tk.Frame(root)
        toolbar.pack(side=tk.TOP, fill=tk.X)

        tk.Button(toolbar, text="Open", command=self.open_pdf).pack(side=tk.LEFT)
        tk.Button(toolbar, text="◀", command=self.prev_page).pack(side=tk.LEFT)
        tk.Button(toolbar, text="▶", command=self.next_page).pack(side=tk.LEFT)
        tk.Button(toolbar, text="+", command=self.zoom_in).pack(side=tk.LEFT)
        tk.Button(toolbar, text="-", command=self.zoom_out).pack(side=tk.LEFT)
        tk.Button(toolbar, text="Find", command=self.find_text).pack(side=tk.LEFT)
        tk.Button(toolbar, text="Go to", command=self.goto_page).pack(side=tk.LEFT)

        self.page_label = tk.Label(toolbar, text="Page: 0/0")
        self.page_label.pack(side=tk.RIGHT)

        self.canvas = tk.Canvas(root, bg="gray")
        self.v_scroll = tk.Scrollbar(root, orient=tk.VERTICAL, command=self.canvas.yview)
        self.h_scroll = tk.Scrollbar(root, orient=tk.HORIZONTAL, command=self.canvas.xview)

        self.canvas.configure(
            yscrollcommand=self.v_scroll.set,
            xscrollcommand=self.h_scroll.set
        )

        self.v_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        self.h_scroll.pack(side=tk.BOTTOM, fill=tk.X)
        self.canvas.pack(fill=tk.BOTH, expand=True)

        self.tk_img = None

        root.bind("<Control-f>", lambda e: self.find_text())
        root.bind("<Control-o>", lambda e: self.open_pdf())
        root.bind("<Right>", lambda e: self.next_page())
        root.bind("<Left>", lambda e: self.prev_page())

    def open_pdf(self):
        path = filedialog.askopenfilename(filetypes=[("PDF files", "*.pdf")])
        if not path:
            return

        try:
            self.doc = fitz.open(normalize_path(path))
            self.page_index = 0
            self.zoom = 1.0
            self.search_results.clear()
            self.render_page()
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def render_page(self):
        if not self.doc:
            return

        page = self.doc[self.page_index]
        mat = fitz.Matrix(self.zoom, self.zoom)
        pix = page.get_pixmap(matrix=mat)

        mode = "RGB" if pix.alpha == 0 else "RGBA"
        img = Image.frombytes(mode, [pix.width, pix.height], pix.samples)

        self.tk_img = ImageTk.PhotoImage(img)

        self.canvas.delete("all")
        self.canvas.create_image(0, 0, anchor=tk.NW, image=self.tk_img)
        self.canvas.config(scrollregion=(0, 0, pix.width, pix.height))

        self.page_label.config(
            text=f"Page: {self.page_index + 1}/{len(self.doc)}"
        )

        self.highlight_search()

    def next_page(self):
        if self.doc and self.page_index < len(self.doc) - 1:
            self.page_index += 1
            self.render_page()

    def prev_page(self):
        if self.doc and self.page_index > 0:
            self.page_index -= 1
            self.render_page()

    def goto_page(self):
        if not self.doc:
            return
        p = simpledialog.askinteger(
            "Go to page", f"1 – {len(self.doc)}"
        )
        if p and 1 <= p <= len(self.doc):
            self.page_index = p - 1
            self.render_page()

    def zoom_in(self):
        if self.doc:
            self.zoom *= 1.25
            self.render_page()

    def zoom_out(self):
        if self.doc:
            self.zoom /= 1.25
            self.render_page()

    def find_text(self):
        if not self.doc:
            return

        query = simpledialog.askstring("Find", "Text:")
        if not query:
            return

        self.search_results.clear()

        for i in range(len(self.doc)):
            page = self.doc[i]
            matches = page.search_for(query)
            for rect in matches:
                self.search_results.append((i, rect))

        if not self.search_results:
            messagebox.showinfo("Find", "No matches found")
            return

        self.search_index = 0
        self.jump_to_search()

    def jump_to_search(self):
        page, rect = self.search_results[self.search_index]
        self.page_index = page
        self.render_page()

    def highlight_search(self):
        if not self.search_results:
            return

        mat = fitz.Matrix(self.zoom, self.zoom)

        for p, rect in self.search_results:
            if p == self.page_index:
                r = rect * mat
                self.canvas.create_rectangle(
                    r.x0, r.y0, r.x1, r.y1,
                    outline="red", width=2
                )


if __name__ == "__main__":
    root = tk.Tk()
    root.geometry("1000x800")
    PDFReader(root)
    root.mainloop()
