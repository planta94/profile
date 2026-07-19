import os
import urllib.request
import zipfile
from PIL import Image as PILImage, ImageDraw
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# URLs for premium Google Font (Inter)
INTER_REG_URL = "https://gwfh.mranftl.com/api/fonts/inter?download=zip&subsets=latin&variants=regular,700,italic"

def setup_fonts():
    """Download, extract and register the Inter font family for premium typography. Fallback to Helvetica."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    zip_path = os.path.join(script_dir, "inter.zip")
    
    # Target files extracted from zip
    reg_path = os.path.join(script_dir, "inter-v20-latin-regular.ttf")
    bold_path = os.path.join(script_dir, "inter-v20-latin-700.ttf")
    italic_path = os.path.join(script_dir, "inter-v20-latin-italic.ttf")
    
    # Download and extract if they do not exist
    if not (os.path.exists(reg_path) and os.path.exists(bold_path) and os.path.exists(italic_path)):
        try:
            print("Downloading Inter font family from Google Webfonts Helper...")
            urllib.request.urlretrieve(INTER_REG_URL, zip_path)
            
            print("Extracting font package...")
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(script_dir)
                
            # Clean up the zip archive
            if os.path.exists(zip_path):
                os.remove(zip_path)
        except Exception as e:
            print(f"Font download/extraction failed ({e}). Falling back to system fonts.")
            return {
                'reg': 'Helvetica',
                'bold': 'Helvetica-Bold',
                'italic': 'Helvetica-Oblique'
            }
            
    try:
        pdfmetrics.registerFont(TTFont('Inter', reg_path))
        pdfmetrics.registerFont(TTFont('Inter-Bold', bold_path))
        pdfmetrics.registerFont(TTFont('Inter-Italic', italic_path))
        return {
            'reg': 'Inter',
            'bold': 'Inter-Bold',
            'italic': 'Inter-Italic'
        }
    except Exception as e:
        print(f"Font registration failed ({e}). Falling back to Helvetica.")
        return {
            'reg': 'Helvetica',
            'bold': 'Helvetica-Bold',
            'italic': 'Helvetica-Oblique'
        }

# Setup fonts globally at startup
FONT_NAMES = setup_fonts()

def prepare_profile_photo():
    """Copy the profile photo to dest_path without cropping to keep its full aspect ratio."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)
    src_path = os.path.join(root_dir, "public", "profile_cv.jpg")
    dest_path = os.path.join(root_dir, "public", "profile_square.jpg")
    
    if not os.path.exists(src_path):
        print(f"Profile photo not found at {src_path}. Skipping photo.")
        return None
        
    try:
        with PILImage.open(src_path) as img:
            img.save(dest_path, "JPEG", quality=95)
            return dest_path
    except Exception as e:
        print(f"Failed to prepare profile photo ({e}). Skipping photo.")
        return None

# Canvas class to handle footers and page numbering
class ProfessionalCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(ProfessionalCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_footer(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_footer(self, page_count):
        self.saveState()
        self.setFont(FONT_NAMES['reg'], 8)
        self.setFillColor(HexColor("#64748b"))
        
        # Draw a thin footer divider line starting from the main content side
        self.setStrokeColor(HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(185, 40, 559, 40)
        
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(559, 26, page_text)
        self.drawString(185, 26, "Dr. Chia Min Yan  |  Curriculum Vitae  |  Data Scientist")
        self.restoreState()

def draw_background(canvas_obj, doc_obj):
    """Draw the professional cool grey sidebar background before flowables are layered on top."""
    canvas_obj.saveState()
    canvas_obj.setFillColor(HexColor("#f8fafc"))
    # Left sidebar background block (x=0 to x=165)
    canvas_obj.rect(0, 0, 165, 842, fill=1, stroke=0)
    canvas_obj.restoreState()

def make_skill_tag(tag_text, font_names):
    """Create a styled text badge for the sidebar."""
    tag_style = ParagraphStyle(
        'TagStyle',
        fontName=font_names['bold'],
        fontSize=7,
        leading=9,
        textColor=HexColor("#2563eb"),
        alignment=1 # Center
    )
    p = Paragraph(tag_text, tag_style)
    t = Table([[p]], colWidths=[59], rowHeights=[14])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor("#eff6ff")),
        ('BOX', (0,0), (-1,-1), 0.5, HexColor("#bfdbfe")),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 2),
        ('RIGHTPADDING', (0,0), (-1,-1), 2),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    return t

def make_skills_grid(skills, font_names):
    """Layout a list of skills into a clean 2-column tag grid."""
    rows = []
    for i in range(0, len(skills), 2):
        row = []
        row.append(make_skill_tag(skills[i], font_names))
        if i + 1 < len(skills):
            row.append(make_skill_tag(skills[i+1], font_names))
        else:
            row.append('')
        rows.append(row)
    grid = Table(rows, colWidths=[60, 60])
    grid.setStyle(TableStyle([
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    return grid

def make_job_header(title, company, dates, font_names):
    """Helper to create a beautiful structured job title line."""
    title_style = ParagraphStyle(
        'JobTitle',
        fontName=font_names['bold'],
        fontSize=9,
        leading=12,
        textColor=HexColor("#0f172a")
    )
    dates_style = ParagraphStyle(
        'JobDates',
        fontName=font_names['italic'],
        fontSize=7.5,
        leading=11,
        textColor=HexColor("#64748b"),
        alignment=2 # Right
    )
    comp_style = ParagraphStyle(
        'JobComp',
        fontName=font_names['bold'],
        fontSize=8,
        leading=11,
        textColor=HexColor("#475569")
    )
    
    title_p = Paragraph(f"<b>{title}</b>", title_style)
    dates_p = Paragraph(dates, dates_style)
    
    # Sum of colWidths is exactly 374 (main content column width)
    t = Table([[title_p, dates_p]], colWidths=[180, 194])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    
    comp_p = Paragraph(company, comp_style)
    return [t, comp_p]

def make_education_header(degree, institution, dates, font_names):
    """Helper to create a beautiful structured education title line."""
    degree_style = ParagraphStyle(
        'Degree',
        fontName=font_names['bold'],
        fontSize=9,
        leading=12,
        textColor=HexColor("#0f172a")
    )
    dates_style = ParagraphStyle(
        'EduDates',
        fontName=font_names['italic'],
        fontSize=7.5,
        leading=11,
        textColor=HexColor("#64748b"),
        alignment=2 # Right
    )
    inst_style = ParagraphStyle(
        'EduInst',
        fontName=font_names['bold'],
        fontSize=8,
        leading=11,
        textColor=HexColor("#475569")
    )
    
    degree_p = Paragraph(f"<b>{degree}</b>", degree_style)
    dates_p = Paragraph(dates, dates_style)
    
    # Sum of colWidths is exactly 374 (main content column width)
    t = Table([[degree_p, dates_p]], colWidths=[250, 124])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    
    inst_p = Paragraph(institution, inst_style)
    return [t, inst_p]

def make_bullet_point(bullet_text, bullet_style, bullet_width=10, text_width=364):
    """Helper to create a beautiful structured bullet point using a Table to prevent text justification bugs."""
    bullet_symbol_style = ParagraphStyle(
        'BulletSymbol',
        parent=bullet_style,
        leftIndent=0,
        firstLineIndent=0,
        spaceAfter=0,
        alignment=0 # Left-aligned bullet symbol
    )
    bullet_p = Paragraph("•", bullet_symbol_style)
    text_p = Paragraph(bullet_text, bullet_style)
    
    t = Table([[bullet_p, text_p]], colWidths=[bullet_width, text_width])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    return t

def build_pdf():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)
    pdf_path = os.path.join(root_dir, "public", "CV.pdf")
    font_names = FONT_NAMES
    photo_path = prepare_profile_photo()
    
    # Setup document. A4 is 595 x 842. Margins match our background layout.
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=15,    # Tight margin to keep sidebar flowable aligned
        rightMargin=36,
        topMargin=36,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()
    
    # Colors
    PRIMARY = HexColor("#0f172a")      # Slate 900
    ACCENT = HexColor("#2563eb")       # Cobalt Blue
    TEXT_MUTED = HexColor("#475569")   # Slate 600
    BORDER_COLOR = HexColor("#cbd5e1") # Slate 300
    
    # Custom Paragraph Styles with Dynamic Fonts
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName=font_names['bold'],
        fontSize=28,
        leading=30,
        textColor=PRIMARY
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName=font_names['bold'],
        fontSize=12,
        leading=15,
        textColor=ACCENT
    )
    
    section_title = ParagraphStyle(
        'SectionTitle',
        parent=styles['Normal'],
        fontName=font_names['bold'],
        fontSize=11,
        leading=15,
        textColor=ACCENT,
        keepWithNext=True
    )
    
    sidebar_section_title = ParagraphStyle(
        'SidebarSectionTitle',
        parent=styles['Normal'],
        fontName=font_names['bold'],
        fontSize=9.5,
        leading=12,
        textColor=PRIMARY,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName=font_names['reg'],
        fontSize=8.5,
        leading=12,
        textColor=PRIMARY,
        spaceAfter=4,
        alignment=4 # Justified
    )
    
    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName=font_names['reg'],
        fontSize=8,
        leading=11.5,
        textColor=PRIMARY,
        leftIndent=0,
        firstLineIndent=0,
        spaceAfter=0,
        alignment=4 # Justified
    )
    
    sidebar_bullet_style = ParagraphStyle(
        'SidebarBullet',
        parent=styles['Normal'],
        fontName=font_names['reg'],
        fontSize=8,
        leading=11.5,
        textColor=PRIMARY,
        leftIndent=0,
        firstLineIndent=0,
        spaceAfter=0,
        alignment=0 # Left-aligned (ragged right) for narrow sidebar
    )
    
    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName=font_names['italic'],
        fontSize=7.5,
        leading=10.5,
        textColor=TEXT_MUTED,
        spaceAfter=3
    )
    
    tech_badge_style = ParagraphStyle(
        'TechBadge',
        parent=styles['Normal'],
        fontName=font_names['bold'],
        fontSize=7.5,
        leading=9.5,
        textColor=ACCENT,
        spaceAfter=5
    )

    # Helper function to construct beautiful section headers with horizontal line underlines
    def make_section_header(title_text):
        p = Paragraph(title_text, section_title)
        t = Table([[p]], colWidths=[374])
        t.setStyle(TableStyle([
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('LINEBELOW', (0,0), (-1,-1), 1.2, ACCENT),
        ]))
        return t

    def make_sidebar_header(title_text):
        p = Paragraph(title_text, sidebar_section_title)
        t = Table([[p]], colWidths=[125])
        t.setStyle(TableStyle([
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('LINEBELOW', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ]))
        return t

    story = []

    # ------------------ HEADER SECTION (TWO-COLUMN LAYOUT) ------------------
    header_left = [
        Paragraph("DR. CHIA MIN YAN", title_style),
        Spacer(1, 4),
        Paragraph("Data Scientist | ML Engineer | Engineering PhD", subtitle_style)
    ]
    
    contact_style = ParagraphStyle(
        'HeaderContact',
        parent=styles['Normal'],
        fontName=font_names['reg'],
        fontSize=9,
        leading=13,
        textColor=TEXT_MUTED,
        alignment=2 # Right-aligned
    )
    header_right = [
        Paragraph("<b>Email:</b> chiamy94@gmail.com", contact_style),
        Paragraph("<b>Phone:</b> (+60) 19-2508182", contact_style),
        Paragraph("<b>Web:</b> minyanchia.github.io", contact_style),
        Paragraph("<b>Loc:</b> Selangor, Malaysia", contact_style)
    ]
    
    header_table = Table([[header_left, header_right]], colWidths=[380, 164])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LINEBELOW', (0,0), (-1,-1), 1.5, ACCENT),
        ('LEFTPADDING', (0,0), (0,-1), 5),
        ('RIGHTPADDING', (1,0), (1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 12))

    # ------------------ PAGE 1 CONTENT LAYOUT ------------------
    sidebar_p1 = []
    
    # 1. Profile photo
    if photo_path:
        # Get aspect ratio of the photo dynamically
        img_w, img_h = 70, 70
        try:
            with PILImage.open(photo_path) as img:
                w_orig, h_orig = img.size
                aspect = h_orig / w_orig
                img_w = 70
                img_h = 70 * aspect
        except Exception:
            pass
            
        photo_flowable = RLImage(photo_path, width=img_w, height=img_h)
        photo_table = Table([[photo_flowable]], colWidths=[img_w + 4], rowHeights=[img_h + 4])
        photo_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.white),
            ('BOX', (0,0), (-1,-1), 1.5, BORDER_COLOR),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 2),
            ('RIGHTPADDING', (0,0), (-1,-1), 2),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ]))
        
        # Center the photo container in the sidebar
        photo_container = Table([[photo_table]], colWidths=[125])
        photo_container.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ]))
        sidebar_p1.append(photo_container)

    sidebar_p1.append(make_sidebar_header("PROFILE SUMMARY"))
    sidebar_p1.append(Spacer(1, 4))
    sidebar_p1.append(Paragraph(
        "Dr. Chia Min Yan is an engineering PhD and Data Scientist working at the intersection of Machine Learning, Generative AI, and process optimization. He has published 5+ research articles in top-tier Q1 Web of Science journals. He designs and implements production-grade predictive models, scalable microservice architectures, and autonomous agentic workflows that bridge scientific engineering with commercial AI applications.",
        ParagraphStyle('SidebarSummary', parent=body_style, fontName=font_names['reg'], fontSize=7.5, leading=10.5, textColor=TEXT_MUTED)
    ))
    sidebar_p1.append(Spacer(1, 10))
    
    sidebar_p1.append(make_sidebar_header("DEVELOPMENT &amp; CORE TOOLS"))
    sidebar_p1.append(Spacer(1, 5))
    skills_list = [
        "Python (ML)", "PyTorch",
        "TypeScript", "JavaScript",
        "Node.js", "Fastify", "FastAPI",
        "Angular", "SQL",
        "PostgreSQL", "MATLAB"
    ]
    sidebar_p1.append(make_skills_grid(skills_list, font_names))
    sidebar_p1.append(Spacer(1, 10))
        
    sidebar_p1.append(make_sidebar_header("DEVELOPER TOOLS"))
    sidebar_p1.append(Spacer(1, 5))
    dev_tools = [
        "Docker", "Kubenetes",
        "Git &amp; CI/CD", "LangChain",
        "LLMs (RAG)"
    ]
    sidebar_p1.append(make_skills_grid(dev_tools, font_names))
    
    # Right Main content list (Page 1)
    main_p1 = []
    
    main_p1.append(make_section_header("PROFESSIONAL EXPERIENCE"))
    main_p1.append(Spacer(1, 8))
    
    # Job 1: Juice Up
    job1_header = make_job_header(
        "Machine Learning Engineer",
        "Juice Up EV Grid Sdn. Bhd.",
        "July 2026 – Present",
        font_names
    )
    main_p1.extend(job1_header)
    main_p1.append(Spacer(1, 4))
    main_p1.append(make_bullet_point("<b>Algorithms &amp; Systems:</b> Lead the end-to-end research, architecture, and deployment of production-grade statistical algorithms and systems (rewards program optimization, EV fleet charging schedules, station utilization) to drive EV charging network operations.", bullet_style, bullet_width=10, text_width=364))
    main_p1.append(make_bullet_point("<b>Full Stack &amp; Backend Architecture:</b> Spearhead the technical design of scalable backend microservices, rewards database structures, and RESTful APIs, while directing frontend development of responsive EV fleet management portals and interactive customer dashboards.", bullet_style, bullet_width=10, text_width=364))
    main_p1.append(make_bullet_point("<b>Generative AI Initiatives:</b> Champion corporate AI strategies, orchestrating custom LLM integrations and advanced agentic frameworks to automate complex reasoning and EV customer support workflows.", bullet_style, bullet_width=10, text_width=364))
    main_p1.append(Paragraph("<b>Technologies:</b> Python, TypeScript, Node.js, Angular, PostgreSQL, Git, Docker", tech_badge_style))
    main_p1.append(Spacer(1, 10))
    
    # Job 1.5: PAIDChain
    job1_5_header = make_job_header(
        "Data Scientist",
        "PAIDChain Sdn. Bhd.",
        "July 2022 – July 2026",
        font_names
    )
    main_p1.extend(job1_5_header)
    main_p1.append(Spacer(1, 4))
    main_p1.append(make_bullet_point("<b>Machine Learning Engineering:</b> Research, build, and deploy core enterprise statistical models including real-time fraud detection systems, merchant risk anomaly trackers, system monitors, and algorithmic credit scoring structures.", bullet_style, bullet_width=10, text_width=364))
    main_p1.append(make_bullet_point("<b>Full Stack Architecture:</b> Lead the design and implementation of highly scalable backend RESTful APIs, database structures, and responsive web portals/interactive dashboards using Node.js, TypeScript, PostgreSQL, and Angular.", bullet_style, bullet_width=10, text_width=364))
    main_p1.append(make_bullet_point("<b>Generative AI Initiatives:</b> Champion corporate AI strategies by setting up, orchestrating, and launching custom LLM integrations, retrieval-augmented generation (RAG) models, and advanced agentic frameworks for workflow automation.", bullet_style, bullet_width=10, text_width=364))
    main_p1.append(Paragraph("<b>Technologies:</b> Python, TypeScript, Node.js, Angular, PostgreSQL, Git, Docker, LangChain", tech_badge_style))
    main_p1.append(Spacer(1, 10))
    
    # Job 2
    job2_header = make_job_header(
        "Production Engineer",
        "Maxter Glove Manufacturing Sdn. Bhd.",
        "Jan 2019 – April 2019",
        font_names
    )
    main_p1.extend(job2_header)
    main_p1.append(Spacer(1, 4))
    main_p1.append(make_bullet_point("Monitored glove quality assurance workflows and parameters to satisfy international regulatory compliance and client product specifications.", bullet_style, bullet_width=10, text_width=364))
    main_p1.append(make_bullet_point("Standardized preventative line maintenance records and engineered key operations tracking documents to minimize system downtime.", bullet_style, bullet_width=10, text_width=364))
    main_p1.append(Spacer(1, 10))
    
    # Job 3
    job3_header = make_job_header(
        "Production Engineer (Intern)",
        "Maxter Glove Manufacturing Sdn. Bhd.",
        "Oct 2015 – Dec 2015",
        font_names
    )
    main_p1.extend(job3_header)
    main_p1.append(Spacer(1, 4))
    main_p1.append(make_bullet_point("Supervised and maintained treatment variables for the industrial wastewater facility, guaranteeing 100% compliance with national ecological parameters.", bullet_style, bullet_width=10, text_width=364))
    main_p1.append(make_bullet_point("Designed chemical dosing optimization strategies, successfully lowering operation costs and reducing chemical waste.", bullet_style, bullet_width=10, text_width=364))

    # Table colWidths sum to 544pt. Left is 150pt. Right is 394pt.
    table_p1 = Table([[sidebar_p1, main_p1]], colWidths=[150, 394])
    table_p1.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (0,-1), 5),
        ('RIGHTPADDING', (0,0), (0,-1), 20),
        ('LEFTPADDING', (1,0), (1,-1), 20),
        ('RIGHTPADDING', (1,0), (1,-1), 0),
        ('LINEAFTER', (0,0), (0,-1), 0.5, BORDER_COLOR),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    
    story.append(table_p1)
    
    # ------------------ PAGE BREAK ------------------
    story.append(PageBreak())
    
    # ------------------ PAGE 2 CONTENT LAYOUT ------------------
    sidebar_p2 = []
    
    sidebar_p2.append(make_sidebar_header("LANGUAGES"))
    sidebar_p2.append(Spacer(1, 4))
    sidebar_p2.append(make_bullet_point("<b>English</b> — Professional", sidebar_bullet_style, bullet_width=8, text_width=117))
    sidebar_p2.append(make_bullet_point("<b>Chinese (Mandarin)</b> — Native", sidebar_bullet_style, bullet_width=8, text_width=117))
    sidebar_p2.append(make_bullet_point("<b>Bahasa Melayu</b> — Professional", sidebar_bullet_style, bullet_width=8, text_width=117))
    sidebar_p2.append(make_bullet_point("<b>Korean</b> — Conversational", sidebar_bullet_style, bullet_width=8, text_width=117))
    sidebar_p2.append(Spacer(1, 10))
    
    sidebar_p2.append(make_sidebar_header("RESEARCH INTERESTS"))
    sidebar_p2.append(Spacer(1, 4))
    sidebar_p2.append(make_bullet_point("Environmental System Modelling", sidebar_bullet_style, bullet_width=8, text_width=117))
    sidebar_p2.append(make_bullet_point("Agentic Decision Architectures", sidebar_bullet_style, bullet_width=8, text_width=117))
    sidebar_p2.append(make_bullet_point("Applied ML in Process Systems", sidebar_bullet_style, bullet_width=8, text_width=117))
    sidebar_p2.append(make_bullet_point("Polymer composite membranes", sidebar_bullet_style, bullet_width=8, text_width=117))
    sidebar_p2.append(make_bullet_point("Sustainable fuel cells", sidebar_bullet_style, bullet_width=8, text_width=117))
    sidebar_p2.append(Spacer(1, 10))
    
    sidebar_p2.append(make_sidebar_header("PROFESSIONAL AFFILIATIONS"))
    sidebar_p2.append(Spacer(1, 4))
    sidebar_p2.append(make_bullet_point("Graduate Member — Board of Engineers Malaysia (BEM)", sidebar_bullet_style, bullet_width=8, text_width=117))
    sidebar_p2.append(make_bullet_point("Graduate Member — Institution of Engineers, Malaysia (IEM)", sidebar_bullet_style, bullet_width=8, text_width=117))
    sidebar_p2.append(make_bullet_point("Associate Member — Inst. of Chemical Engineers (IChemE)", sidebar_bullet_style, bullet_width=8, text_width=117))
    sidebar_p2.append(make_bullet_point("Graduate Technologist — Malaysia Board of Tech (MBOT)", sidebar_bullet_style, bullet_width=8, text_width=117))
    sidebar_p2.append(Spacer(1, 10))
    
    sidebar_p2.append(make_sidebar_header("EXTRACURRICULARS"))
    sidebar_p2.append(Spacer(1, 4))
    sidebar_p2.append(make_bullet_point("<b>UTAR Chinese Debate Team</b> (2018–2022)", sidebar_bullet_style, bullet_width=8, text_width=117))
    
    dash_style = ParagraphStyle('SidebarDash', parent=sidebar_bullet_style, leftIndent=0, firstLineIndent=0)
    
    def make_sidebar_subbullet(text_content):
        bullet_p = Paragraph("-", dash_style)
        text_p = Paragraph(text_content, dash_style)
        t = Table([[bullet_p, text_p]], colWidths=[8, 117])
        t.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ]))
        return t
    
    sidebar_p2.append(make_sidebar_subbullet("Completed in the 16th and 17th National Varsity Chinese Debate Tournaments."))
    sidebar_p2.append(make_sidebar_subbullet("Represented UTAR in the 2018 Nan Ying Cup Debate in China."))
    
    # Right Main content list (Page 2)
    main_p2 = []
    
    main_p2.append(make_section_header("EDUCATION"))
    main_p2.append(Spacer(1, 8))
    
    # PhD
    phd_header = make_education_header(
        "Doctor of Philosophy (Engineering)",
        "Universiti Tunku Abdul Rahman, Malaysia",
        "2019 – 2022",
        font_names
    )
    main_p2.extend(phd_header)
    main_p2.append(Spacer(1, 3))
    main_p2.append(Paragraph("<i>Thesis: Robust Data Fusion Techniques Integrated Machine Learning Models for Estimating Reference Evapotranspiration. Developed deep learning models and custom stochastic optimization algorithms to resolve data sparsity.</i>", ParagraphStyle('ThesisStyle', parent=body_style, fontName=font_names['italic'], fontSize=8, leading=10.5, textColor=TEXT_MUTED)))
    main_p2.append(Spacer(1, 8))
    
    # Master's
    ms_header = make_education_header(
        "Master of Engineering Science",
        "Universiti Tunku Abdul Rahman, Malaysia",
        "2017 – 2019",
        font_names
    )
    main_p2.extend(ms_header)
    main_p2.append(Spacer(1, 3))
    main_p2.append(Paragraph("<i>Dissertation: Development of High Performance Sulfonated Poly (Ether Ether Ketone) Based Composite Proton Exchange Membranes. Investigated chemical parameters to increase proton fuel cell membrane performance.</i>", ParagraphStyle('DissStyle', parent=body_style, fontName=font_names['italic'], fontSize=8, leading=10.5, textColor=TEXT_MUTED)))
    main_p2.append(Spacer(1, 8))
    
    # Bachelor's
    bs_header = make_education_header(
        "Bachelor of Engineering (Hons.) Chemical Engineering",
        "Universiti Tunku Abdul Rahman, Malaysia",
        "2013 – 2016",
        font_names
    )
    main_p2.extend(bs_header)
    main_p2.append(Spacer(1, 3))
    main_p2.append(Paragraph("<b>CGPA: 3.8758 / 4.0000 (Distinction)</b>", ParagraphStyle('CGPAStyle', parent=body_style, fontName=font_names['bold'], fontSize=8, textColor=ACCENT)))
    main_p2.append(Spacer(1, 14))
    
    main_p2.append(make_section_header("SELECTED PUBLICATIONS"))
    main_p2.append(Spacer(1, 8))
    
    pubs = [
        "Wong, Y.J.*, Yeganeh, A., <b>Chia, M.Y.*</b>, et al. 2023. Quantification of COVID-19 impacts on NO2 and O3: Systematic model selection and hyperparameter optimization on AI-based meteorological-normalization methods. <i>Atmospheric Environment</i>. [Q1]",
        "Wai, K.P., <b>Chia, M.Y.</b>, Koo, C.H.*, Huang, Y.F. and Chong, W.C. 2022. Applications of deep learning in water quality management: A state-of-the-art review. <i>Journal of Hydrology</i>. [Q1]",
        "<b>Chia, M.Y.</b>, Huang, Y.F.*, Koo, C.H., Ng, J.L., Ahmed, A.N. and El-Shafie, A. 2022. Long-term forecasting of monthly mean reference evapotranspiration using deep neural network: A comparison of training strategies and approaches. <i>Applied Soft Computing</i>. [Q1]",
        "<b>Chia, M.Y.</b>, Huang, Y.F.* and Koo, C.H. 2022. Resolving data-hungry nature of machine learning reference evapotranspiration estimating models using inter-model ensembles with various data management schemes. <i>Agricultural Water Management</i>. [Q1]",
        "<b>Chia, M.Y.</b>, Huang, Y.F.* and Koo, C.H. 2021. Improving reference evapotranspiration estimation using novel inter-model ensemble approaches. <i>Computers and Electronics in Agriculture</i>. [Q1]"
    ]
    
    for pub in pubs:
        main_p2.append(Paragraph(pub, ParagraphStyle('PubStyle', parent=body_style, fontName=font_names['reg'], fontSize=7.5, leading=10, textColor=PRIMARY, spaceAfter=5)))
    
    main_p2.append(Spacer(1, 8))
    main_p2.append(Paragraph("REFERENCES AVAILABLE UPON REQUEST", ParagraphStyle('RefTitle', parent=styles['Normal'], fontName=font_names['bold'], fontSize=8, leading=10, textColor=TEXT_MUTED)))

    table_p2 = Table([[sidebar_p2, main_p2]], colWidths=[150, 394])
    table_p2.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (0,-1), 5),
        ('RIGHTPADDING', (0,0), (0,-1), 20),
        ('LEFTPADDING', (1,0), (1,-1), 20),
        ('RIGHTPADDING', (1,0), (1,-1), 0),
        ('LINEAFTER', (0,0), (0,-1), 0.5, BORDER_COLOR),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    
    story.append(table_p2)

    # Build PDF with dynamic sidebar backgrounds drawn underneath flowables
    doc.build(story, canvasmaker=ProfessionalCanvas, onFirstPage=draw_background, onLaterPages=draw_background)
    print("Stunning premium Inter-font PDF created successfully!")
    
    # Copy to root folder for direct workspace synchronization
    try:
        import shutil
        dest_cv = os.path.join(root_dir, "CV.pdf")
        shutil.copyfile(pdf_path, dest_cv)
        print("Synchronized CV.pdf to root workspace!")
    except Exception as e:
        print(f"Failed to copy CV.pdf to root workspace: {e}")

if __name__ == '__main__':
    build_pdf()
