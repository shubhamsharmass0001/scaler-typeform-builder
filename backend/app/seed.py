"""
seed.py — Database seed script

Seeds realistic, production-grade initial data for demonstration:
  - Demo Creator user (id=1, name='Shubham', email='sshubham3_be23@thapar.edu')
  - Form 1: "Customer Satisfaction Survey" (published, slug 'csat2026', 8 questions using all 8 types, 20 responses, 80% completion rate)
  - Form 2: "Event Registration" (published, slug 'eventreg', 6 questions, 24 responses, 79.2% completion rate)
  - Form 3: "Untitled Draft" (draft, no slug, 2 questions, 0 responses)

Idempotent: Only runs if the users table is empty (unless force=True).
"""

from datetime import datetime, timedelta
import random

from app.database import SessionLocal, engine, Base
import app.models  # Register all models with Base.metadata
from app.models.enums import FormStatus, QuestionType
from app.models.user import User
from app.models.form import Form
from app.models.question import Question
from app.models.response import Response
from app.models.answer import Answer


# ---------------------------------------------------------------------------
# Form 1: Customer Satisfaction Survey (20 distinct respondents)
# ---------------------------------------------------------------------------
FORM1_RESPONDENTS = [
    {
        "name": "Sarah Jenkins",
        "email": "sarah.jenkins@acmeproducts.io",
        "plan": "opt_2",  # Pro
        "use_case": "opt_2",  # Customer Feedback
        "rating": 5,
        "team_size": 12,
        "recommend": True,
        "feedback": "The keyboard navigation and smooth transitions make filling forms feel like a delight. Our respondents actually comment on how nice it looks.",
    },
    {
        "name": "Michael Chang",
        "email": "m.chang@cloudscale.net",
        "plan": "opt_3",  # Enterprise
        "use_case": "opt_1",  # Lead Generation
        "rating": 4,
        "team_size": 45,
        "recommend": True,
        "feedback": "Analytics charts are clean and insightful. Would love a scheduled weekly email digest for our leadership team.",
    },
    {
        "name": "Elena Rossi",
        "email": "elena.rossi@designstudio.it",
        "plan": "opt_2",
        "use_case": "opt_2",
        "rating": 5,
        "team_size": 8,
        "recommend": True,
        "feedback": "The typography presets and theme customization match our agency brand guidelines effortlessly.",
    },
    {
        "name": "Priya Nair",
        "email": "priya.nair@fintechglobal.com",
        "plan": "opt_3",
        "use_case": "opt_4",  # Research & Surveys
        "rating": 5,
        "team_size": 80,
        "recommend": True,
        "feedback": "High completion rates compared to our previous static Google forms. Survey conversion jumped 24%.",
    },
    {
        "name": "David Kim",
        "email": "dkim@hypergrowth.co",
        "plan": "opt_1",  # Starter
        "use_case": "opt_1",
        "rating": 4,
        "team_size": 4,
        "recommend": True,
        "feedback": "Super fast onboarding. Had our first beta waitlist live within ten minutes.",
    },
    {
        "name": "Jessica Taylor",
        "email": "jtaylor@edulearn.org",
        "plan": "opt_2",
        "use_case": "opt_3",  # Event Registration
        "rating": 4,
        "team_size": 15,
        "recommend": True,
        "feedback": "The CSV export includes full headers and question mappings, saving our operations staff hours of manual cleanup.",
    },
    {
        "name": "Alexander Wright",
        "email": "alex.wright@quantumflow.dev",
        "plan": "opt_2",
        "use_case": "opt_4",
        "rating": 5,
        "team_size": 22,
        "recommend": True,
        "feedback": "Clean REST API and predictable SQLite schema made data pipeline ingestion completely seamless.",
    },
    {
        "name": "Aisha Al-Mansoor",
        "email": "aisha@venturesync.ae",
        "plan": "opt_3",
        "use_case": "opt_1",
        "rating": 5,
        "team_size": 35,
        "recommend": True,
        "feedback": "Zero lag on mobile browsers. Our international respondents praise the speed.",
    },
    {
        "name": "Carlos Gomez",
        "email": "cgomez@medtechpulse.com",
        "plan": "opt_1",
        "use_case": "opt_2",
        "rating": 3,
        "team_size": 6,
        "recommend": False,
        "feedback": "Decent experience overall, but webhook triggers on submission would be very helpful.",
    },
    {
        "name": "Hannah Schmidt",
        "email": "hannah.schmidt@berlin-ai.de",
        "plan": "opt_2",
        "use_case": "opt_4",
        "rating": 4,
        "team_size": 18,
        "recommend": True,
        "feedback": "The one-question-per-screen paradigm keeps survey respondents focused without cognitive overload.",
    },
    {
        "name": "Lucas Morales",
        "email": "lmorales@saasvibe.io",
        "plan": "opt_1",
        "use_case": "opt_1",
        "rating": 4,
        "team_size": 3,
        "recommend": True,
        "feedback": "Intuitive drag-and-drop question reordering in the builder.",
    },
    {
        "name": "Chloe Martin",
        "email": "chloe.martin@retailnext.co.uk",
        "plan": "opt_3",
        "use_case": "opt_3",
        "rating": 5,
        "team_size": 60,
        "recommend": True,
        "feedback": "Hosted customer feedback forms feel like an integrated extension of our flagship website.",
    },
    {
        "name": "Daniel Murphy",
        "email": "dmurphy@bostondata.org",
        "plan": "opt_2",
        "use_case": "opt_4",
        "rating": 4,
        "team_size": 14,
        "recommend": True,
        "feedback": "The response breakdown with percentage distributions gives instant clarity.",
    },
    {
        "name": "Zoe Takahashi",
        "email": "zoe@tokyocreative.jp",
        "plan": "opt_2",
        "use_case": "opt_2",
        "rating": 5,
        "team_size": 9,
        "recommend": True,
        "feedback": "Sleek aesthetics and responsive micro-animations match Typeform signature polish.",
    },
    {
        "name": "Liam O'Connor",
        "email": "liam.oc@dublintech.ie",
        "plan": "opt_1",
        "use_case": "opt_1",
        "rating": 4,
        "team_size": 5,
        "recommend": True,
        "feedback": "Really appreciate how lightweight the public form is. Loads in under 200 milliseconds.",
    },
    {
        "name": "Olivia Bennett",
        "email": "olivia.bennett@apexsystems.com",
        "plan": "opt_3",
        "use_case": "opt_3",
        "rating": 5,
        "team_size": 110,
        "recommend": True,
        "feedback": "Foreign key cascade rules and relational integrity ensure zero orphan data in our tables.",
    },
    # 4 Partial respondents (dropped at different questions)
    {
        "name": "Marcus Johnson",
        "email": "mjohnson@chicagoapps.dev",
        "plan": "opt_2",
        "use_case": "opt_1",
        "rating": 4,
        "team_size": None,
        "recommend": None,
        "feedback": None,
        "drop_at_index": 4,  # Dropped at Rating question
    },
    {
        "name": "Ryan Cooper",
        "email": "rcooper@austincapital.com",
        "plan": "opt_1",
        "use_case": None,
        "rating": None,
        "team_size": None,
        "recommend": None,
        "feedback": None,
        "drop_at_index": 2,  # Dropped at Plan question
    },
    {
        "name": "Nathaniel Brooks",
        "email": "nate.brooks@seattlecloud.org",
        "plan": None,
        "use_case": None,
        "rating": None,
        "team_size": None,
        "recommend": None,
        "feedback": None,
        "drop_at_index": 1,  # Dropped at Email question
    },
    {
        "name": "Emma Watson",
        "email": "emma.w@oxfordresearch.ac.uk",
        "plan": "opt_1",
        "use_case": "opt_4",
        "rating": 5,
        "team_size": 11,
        "recommend": None,
        "feedback": None,
        "drop_at_index": 6,  # Dropped at Recommend question
    },
]


# ---------------------------------------------------------------------------
# Form 2: Event Registration (24 completely distinct respondents)
# ---------------------------------------------------------------------------
FORM2_RESPONDENTS = [
    {
        "name": "Ananya Sharma",
        "email": "ananya.sharma@nexushealth.in",
        "ticket": "opt_2",  # VIP Pass
        "tracks": ["opt_1", "opt_3"],  # AI & Machine Learning, System Design
        "accommodations": False,
        "topics": "Practical implementation of LLM agents in production healthcare workflows.",
    },
    {
        "name": "Benjamin Hayes",
        "email": "bhayes@auroratech.io",
        "ticket": "opt_1",  # General Admission
        "tracks": ["opt_2", "opt_3"],  # Frontend Architecture, System Design
        "accommodations": False,
        "topics": "Next.js App Router performance tuning and hydration reduction at scale.",
    },
    {
        "name": "Camille Dubois",
        "email": "camille.dubois@paris-analytics.fr",
        "ticket": "opt_2",
        "tracks": ["opt_4"],  # Leadership & Strategy
        "accommodations": True,
        "topics": "Building cross-functional engineering cultures across globally distributed teams.",
    },
    {
        "name": "Derek Vance",
        "email": "derek.vance@vancemedia.com",
        "ticket": "opt_1",
        "tracks": ["opt_1"],
        "accommodations": False,
        "topics": "Multimodal AI architectures and vector search benchmarks.",
    },
    {
        "name": "Fatima Zahra",
        "email": "f.zahra@casablancatech.ma",
        "ticket": "opt_2",
        "tracks": ["opt_2", "opt_4"],
        "accommodations": False,
        "topics": "Design tokens and unified component systems bridging Figma and React.",
    },
    {
        "name": "Gabriel Silva",
        "email": "gabriel.silva@saopaulolabs.br",
        "ticket": "opt_1",
        "tracks": ["opt_3"],
        "accommodations": False,
        "topics": "Event-driven microservices with Kafka and SQLite caching layers.",
    },
    {
        "name": "Harper Collins",
        "email": "hcollins@austintech.org",
        "ticket": "opt_3",  # Virtual Attendee
        "tracks": ["opt_1", "opt_2"],
        "accommodations": False,
        "topics": "Generative UI patterns and real-time streaming interfaces.",
    },
    {
        "name": "Isaac Newton",
        "email": "isaac.k@cambridgeconsulting.co.uk",
        "ticket": "opt_2",
        "tracks": ["opt_3", "opt_4"],
        "accommodations": False,
        "topics": "Platform engineering maturity models for high-growth tech companies.",
    },
    {
        "name": "Ji-hoon Park",
        "email": "jihoon.park@seoulventures.kr",
        "ticket": "opt_1",
        "tracks": ["opt_2"],
        "accommodations": False,
        "topics": "State management best practices and reducing re-renders in complex dashboards.",
    },
    {
        "name": "Katrina Ivanova",
        "email": "k.ivanova@nordiccloud.fi",
        "ticket": "opt_2",
        "tracks": ["opt_1", "opt_3"],
        "accommodations": True,
        "topics": "High-throughput inference endpoints and async job queues.",
    },
    {
        "name": "Lars Lindqvist",
        "email": "lars@stockholmlogic.se",
        "ticket": "opt_1",
        "tracks": ["opt_3"],
        "accommodations": False,
        "topics": "Zero-downtime database schema migration strategies.",
    },
    {
        "name": "Maya Lin",
        "email": "maya.lin@bayareasoftware.com",
        "ticket": "opt_2",
        "tracks": ["opt_4"],
        "accommodations": False,
        "topics": "Retaining top engineering talent and transparent career ladders.",
    },
    {
        "name": "Noah Al-Fassi",
        "email": "noah.fassi@dubaiinnovate.ae",
        "ticket": "opt_1",
        "tracks": ["opt_2", "opt_3"],
        "accommodations": False,
        "topics": "Microfrontends and module federation in enterprise apps.",
    },
    {
        "name": "Olivia Tremblay",
        "email": "o.tremblay@montrealai.ca",
        "ticket": "opt_3",
        "tracks": ["opt_1"],
        "accommodations": False,
        "topics": "Fine-tuning open weights models for specialized customer support.",
    },
    {
        "name": "Patrick Weber",
        "email": "pweber@zurichfin.ch",
        "ticket": "opt_2",
        "tracks": ["opt_3", "opt_4"],
        "accommodations": False,
        "topics": "Resilient API gateway architectures and rate-limiting patterns.",
    },
    {
        "name": "Quinn Roberts",
        "email": "quinn.r@sydneycode.com.au",
        "ticket": "opt_1",
        "tracks": ["opt_2"],
        "accommodations": False,
        "topics": "Accessible web components and WCAG AAA compliance testing.",
    },
    {
        "name": "Ravi Teja",
        "email": "ravi.teja@bengalurudevs.in",
        "ticket": "opt_1",
        "tracks": ["opt_1", "opt_3"],
        "accommodations": False,
        "topics": "FastAPI performance optimizations and asynchronous database connection pooling.",
    },
    {
        "name": "Sofia Mendoza",
        "email": "sofia.mendoza@mexicodigital.mx",
        "ticket": "opt_2",
        "tracks": ["opt_4"],
        "accommodations": True,
        "topics": "Transitioning from individual contributor to engineering manager.",
    },
    {
        "name": "Tyler Evans",
        "email": "tevans@denvercloud.net",
        "ticket": "opt_1",
        "tracks": ["opt_3"],
        "accommodations": False,
        "topics": "Disaster recovery scenarios and multiregion failover testing.",
    },
    # 5 Partial respondents (dropped across different questions)
    {
        "name": "Uma Krishnan",
        "email": "uma.k@chennaitech.in",
        "ticket": None,
        "tracks": None,
        "accommodations": None,
        "topics": None,
        "drop_at_index": 1,  # Dropped at Work Email
    },
    {
        "name": "Victor Hugo",
        "email": "vhugo@lisbondev.pt",
        "ticket": "opt_1",
        "tracks": None,
        "accommodations": None,
        "topics": None,
        "drop_at_index": 2,  # Dropped at Ticket Tier
    },
    {
        "name": "Wendy Zhang",
        "email": "wendy.zhang@singaporeops.sg",
        "ticket": "opt_2",
        "tracks": ["opt_1"],
        "accommodations": None,
        "topics": None,
        "drop_at_index": 3,  # Dropped at Tracks
    },
    {
        "name": "Xavier Dupont",
        "email": "xdupont@brusselscode.be",
        "ticket": "opt_1",
        "tracks": ["opt_2"],
        "accommodations": False,
        "topics": None,
        "drop_at_index": 4,  # Dropped at Accommodations
    },
    {
        "name": "Yasmine Badawi",
        "email": "yasmine@cairoventures.eg",
        "ticket": "opt_2",
        "tracks": ["opt_1", "opt_4"],
        "accommodations": False,
        "topics": None,
        "drop_at_index": 5,  # Dropped at Topics
    },
]


def generate_realistic_timestamps(n_responses: int, seed_key: int = 42) -> list[datetime]:
    """
    Generate realistic timestamps spread over the last 14 days relative to now,
    with more responses on weekdays (Mon-Fri) than weekends.
    """
    now = datetime.utcnow()
    rng = random.Random(seed_key)

    # Build pool of days weighted towards weekdays
    day_pool: list[int] = []
    for d in range(14, 0, -1):
        target_date = now - timedelta(days=d)
        weight = 3 if target_date.weekday() < 5 else 1
        day_pool.extend([d] * weight)

    chosen_days = sorted(rng.sample(day_pool, n_responses), reverse=True)

    timestamps = []
    for day_offset in chosen_days:
        base_date = now - timedelta(days=day_offset)
        hour = rng.randint(9, 18)
        minute = rng.randint(0, 59)
        second = rng.randint(0, 59)
        dt = base_date.replace(hour=hour, minute=minute, second=second, microsecond=0)
        timestamps.append(dt)

    return sorted(timestamps)


def seed_database(force: bool = False):
    """
    Populate database with default demo user, 3 rich forms, and realistic response data.
    Idempotent: skips if users table already contains rows (unless force=True).
    """
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        user_count = db.query(User).count()
        if user_count > 0 and not force:
            print("Database already seeded (users table not empty). Skipping seed.")
            return

        if force:
            print("Force re-seeding: clearing existing data...")
            db.query(Answer).delete()
            db.query(Response).delete()
            db.query(Question).delete()
            db.query(Form).delete()
            db.query(User).delete()
            db.commit()

        now = datetime.utcnow()

        # -------------------------------------------------------------------
        # 1. Creator User
        # -------------------------------------------------------------------
        creator = User(
            id=1,
            name="Shubham",
            email="sshubham3_be23@thapar.edu",
            created_at=now - timedelta(days=30),
        )
        db.add(creator)
        db.commit()
        db.refresh(creator)
        print("Created Creator (id=1, name='Shubham', email='sshubham3_be23@thapar.edu')")

        # -------------------------------------------------------------------
        # 2. Form 1: Customer Satisfaction Survey (Published, all 8 types)
        # -------------------------------------------------------------------
        form_1 = Form(
            user_id=creator.id,
            title="Customer Satisfaction Survey",
            description="We would love to hear your feedback on how we are doing and how we can improve our product.",
            status=FormStatus.PUBLISHED,
            slug="csat2026",
            theme={
                "backgroundColor": "#FFFFFF",
                "textColor": "#191919",
                "buttonColor": "#30283B",
                "fontFamily": "Inter",
            },
            welcome_title="Customer Satisfaction Survey",
            welcome_description="Takes 2 minutes. Your feedback directly shapes our product roadmap.",
            welcome_button_text="Start Survey",
            thank_you_title="Thank you for your feedback!",
            thank_you_message="We appreciate your time. Our product team reviews every submission.",
            created_at=now - timedelta(days=20),
            updated_at=now - timedelta(days=15),
        )
        db.add(form_1)
        db.flush()

        f1_questions = [
            Question(
                form_id=form_1.id,
                type=QuestionType.SHORT_TEXT,
                title="What is your full name?",
                description="So we know who to address in follow-ups",
                required=True,
                position=0,
                properties={"placeholder": "e.g. Jane Doe"},
            ),
            Question(
                form_id=form_1.id,
                type=QuestionType.EMAIL,
                title="What is your email address?",
                description="We will never share your email address with third parties",
                required=True,
                position=1,
                properties={"placeholder": "name@company.com"},
            ),
            Question(
                form_id=form_1.id,
                type=QuestionType.MULTIPLE_CHOICE,
                title="Which plan do you currently use?",
                description="Select the tier you are currently subscribed to",
                required=True,
                position=2,
                properties={
                    "options": [
                        {"id": "opt_1", "label": "Starter"},
                        {"id": "opt_2", "label": "Pro"},
                        {"id": "opt_3", "label": "Enterprise"},
                    ],
                    "multiple": False,
                },
            ),
            Question(
                form_id=form_1.id,
                type=QuestionType.DROPDOWN,
                title="What is your primary use case?",
                description="Choose the workflow that best describes your team",
                required=True,
                position=3,
                properties={
                    "options": [
                        {"id": "opt_1", "label": "Lead Generation"},
                        {"id": "opt_2", "label": "Customer Feedback"},
                        {"id": "opt_3", "label": "Event Registration"},
                        {"id": "opt_4", "label": "Research & Surveys"},
                    ]
                },
            ),
            Question(
                form_id=form_1.id,
                type=QuestionType.RATING,
                title="How would you rate your overall experience?",
                description="1 being poor, 5 being exceptional",
                required=True,
                position=4,
                properties={"steps": 5, "shape": "star"},
            ),
            Question(
                form_id=form_1.id,
                type=QuestionType.NUMBER,
                title="How many team members use our tool with you?",
                description="Include both admins and respondents",
                required=False,
                position=5,
                properties={"min": 1, "max": 1000},
            ),
            Question(
                form_id=form_1.id,
                type=QuestionType.YES_NO,
                title="Would you recommend us to a colleague or friend?",
                description=None,
                required=True,
                position=6,
                properties={},
            ),
            Question(
                form_id=form_1.id,
                type=QuestionType.LONG_TEXT,
                title="What is one thing we could do better?",
                description="Any feature requests, papercuts, or suggestions welcome",
                required=False,
                position=7,
                properties={"placeholder": "Share your thoughts here..."},
            ),
        ]
        db.add_all(f1_questions)
        db.flush()
        print(f"Created Form 1 '{form_1.title}' with 8 questions (slug: '{form_1.slug}')")

        # -------------------------------------------------------------------
        # 3. Form 2: Event Registration (Published, 6 questions)
        # -------------------------------------------------------------------
        form_2 = Form(
            user_id=creator.id,
            title="Event Registration",
            description="Register for the upcoming Product & Engineering Summit 2026.",
            status=FormStatus.PUBLISHED,
            slug="eventreg",
            theme={
                "backgroundColor": "#FAFAFA",
                "textColor": "#0F172A",
                "buttonColor": "#005E5D",
                "fontFamily": "Inter",
            },
            welcome_title="Product & Engineering Summit 2026",
            welcome_description="Join 500+ builders for keynotes, interactive workshops, and networking.",
            welcome_button_text="Register Now",
            thank_you_title="You are registered!",
            thank_you_message="Check your email for your confirmation ticket and calendar invite.",
            created_at=now - timedelta(days=18),
            updated_at=now - timedelta(days=12),
        )
        db.add(form_2)
        db.flush()

        f2_questions = [
            Question(
                form_id=form_2.id,
                type=QuestionType.SHORT_TEXT,
                title="Full Name",
                description="First and last name as it should appear on your attendee badge",
                required=True,
                position=0,
                properties={"placeholder": "e.g. Alex Morgan"},
            ),
            Question(
                form_id=form_2.id,
                type=QuestionType.EMAIL,
                title="Work Email",
                description="Where we will send your registration pass and schedule updates",
                required=True,
                position=1,
                properties={"placeholder": "name@work.com"},
            ),
            Question(
                form_id=form_2.id,
                type=QuestionType.DROPDOWN,
                title="Ticket Tier",
                description="Select your attendance pass type",
                required=True,
                position=2,
                properties={
                    "options": [
                        {"id": "opt_1", "label": "General Admission"},
                        {"id": "opt_2", "label": "VIP Pass"},
                        {"id": "opt_3", "label": "Virtual Attendee"},
                    ]
                },
            ),
            Question(
                form_id=form_2.id,
                type=QuestionType.MULTIPLE_CHOICE,
                title="Which tracks are you interested in?",
                description="Choose all sessions you plan to attend",
                required=True,
                position=3,
                properties={
                    "options": [
                        {"id": "opt_1", "label": "AI & Machine Learning"},
                        {"id": "opt_2", "label": "Frontend Architecture"},
                        {"id": "opt_3", "label": "System Design"},
                        {"id": "opt_4", "label": "Leadership & Strategy"},
                    ],
                    "multiple": True,
                },
            ),
            Question(
                form_id=form_2.id,
                type=QuestionType.YES_NO,
                title="Do you require special dietary or accessibility accommodations?",
                description="We cater to all dietary needs and provide live captioning",
                required=True,
                position=4,
                properties={},
            ),
            Question(
                form_id=form_2.id,
                type=QuestionType.LONG_TEXT,
                title="What topics do you hope will be covered?",
                description="Help our keynote speakers tailor content to your interests",
                required=False,
                position=5,
                properties={"placeholder": "e.g. Next.js App Router, Microfrontends, etc."},
            ),
        ]
        db.add_all(f2_questions)
        db.flush()
        print(f"Created Form 2 '{form_2.title}' with 6 questions (slug: '{form_2.slug}')")

        # -------------------------------------------------------------------
        # 4. Form 3: Untitled Draft (Draft status, 2 questions, 0 responses)
        # -------------------------------------------------------------------
        form_3 = Form(
            user_id=creator.id,
            title="Untitled Draft",
            description="Internal employee onboarding questionnaire",
            status=FormStatus.DRAFT,
            slug=None,
            theme={
                "backgroundColor": "#FFFFFF",
                "textColor": "#191919",
                "buttonColor": "#30283B",
                "fontFamily": "Inter",
            },
            welcome_title="Team Onboarding Questionnaire",
            welcome_description="A quick checklist for your first week on the team.",
            welcome_button_text="Get Started",
            thank_you_title="All set!",
            thank_you_message="Welcome aboard to the team.",
            created_at=now - timedelta(days=2),
            updated_at=now - timedelta(days=1),
        )
        db.add(form_3)
        db.flush()

        f3_questions = [
            Question(
                form_id=form_3.id,
                type=QuestionType.SHORT_TEXT,
                title="Preferred nickname or handle",
                description="For your Slack and GitHub accounts",
                required=False,
                position=0,
                properties={"placeholder": "e.g. neo"},
            ),
            Question(
                form_id=form_3.id,
                type=QuestionType.RATING,
                title="Initial confidence in getting started",
                description="How prepared do you feel?",
                required=False,
                position=1,
                properties={"steps": 5, "shape": "star"},
            ),
        ]
        db.add_all(f3_questions)
        db.flush()
        print(f"Created Form 3 '{form_3.title}' (draft, no slug, 2 questions)")

        # -------------------------------------------------------------------
        # 5. Seed Responses for Form 1 (20 responses: 16 complete, 4 partial)
        # -------------------------------------------------------------------
        print("Seeding realistic responses for Form 1...")
        f1_timestamps = generate_realistic_timestamps(len(FORM1_RESPONDENTS), seed_key=101)
        durations_f1 = [95, 140, 110, 205, 75, 160, 185, 130, 220, 145, 80, 240, 165, 125, 90, 260]

        f1_completed_count = 0
        f1_partial_count = 0

        for i, data in enumerate(FORM1_RESPONDENTS):
            started_time = f1_timestamps[i]
            drop_at = data.get("drop_at_index")
            is_complete = drop_at is None

            if is_complete:
                duration_secs = durations_f1[f1_completed_count % len(durations_f1)]
                submitted_time = started_time + timedelta(seconds=duration_secs)
                drop_qid = None
                answered_count = len(f1_questions)
                f1_completed_count += 1
            else:
                submitted_time = None
                drop_qid = f1_questions[drop_at].id
                answered_count = drop_at
                f1_partial_count += 1

            resp = Response(
                form_id=form_1.id,
                started_at=started_time,
                submitted_at=submitted_time,
                is_complete=is_complete,
                last_question_id=drop_qid,
            )
            db.add(resp)
            db.flush()

            raw_answers = [
                (f1_questions[0].id, data["name"]),
                (f1_questions[1].id, data["email"]),
                (f1_questions[2].id, data["plan"]),
                (f1_questions[3].id, data["use_case"]),
                (f1_questions[4].id, data["rating"]),
                (f1_questions[5].id, data["team_size"]),
                (f1_questions[6].id, data["recommend"]),
                (f1_questions[7].id, data["feedback"]),
            ]

            answers_to_add = [
                Answer(response_id=resp.id, question_id=qid, value=val)
                for idx, (qid, val) in enumerate(raw_answers)
                if idx < answered_count and val is not None
            ]
            db.add_all(answers_to_add)

        # -------------------------------------------------------------------
        # 6. Seed Responses for Form 2 (24 responses: 19 complete, 5 partial)
        # -------------------------------------------------------------------
        print("Seeding realistic responses for Form 2...")
        f2_timestamps = generate_realistic_timestamps(len(FORM2_RESPONDENTS), seed_key=202)
        durations_f2 = [115, 85, 145, 90, 160, 130, 75, 195, 105, 170, 120, 140, 155, 95, 180, 110, 135, 165, 125]

        f2_completed_count = 0
        f2_partial_count = 0

        for i, data in enumerate(FORM2_RESPONDENTS):
            started_time = f2_timestamps[i]
            drop_at = data.get("drop_at_index")
            is_complete = drop_at is None

            if is_complete:
                duration_secs = durations_f2[f2_completed_count % len(durations_f2)]
                submitted_time = started_time + timedelta(seconds=duration_secs)
                drop_qid = None
                answered_count = len(f2_questions)
                f2_completed_count += 1
            else:
                submitted_time = None
                drop_qid = f2_questions[drop_at].id
                answered_count = drop_at
                f2_partial_count += 1

            resp = Response(
                form_id=form_2.id,
                started_at=started_time,
                submitted_at=submitted_time,
                is_complete=is_complete,
                last_question_id=drop_qid,
            )
            db.add(resp)
            db.flush()

            raw_answers = [
                (f2_questions[0].id, data["name"]),
                (f2_questions[1].id, data["email"]),
                (f2_questions[2].id, data["ticket"]),
                (f2_questions[3].id, data["tracks"]),
                (f2_questions[4].id, data["accommodations"]),
                (f2_questions[5].id, data["topics"]),
            ]

            answers_to_add = [
                Answer(response_id=resp.id, question_id=qid, value=val)
                for idx, (qid, val) in enumerate(raw_answers)
                if idx < answered_count and val is not None
            ]
            db.add_all(answers_to_add)

        db.commit()

        # -------------------------------------------------------------------
        # 7. Print Seed Summary
        # -------------------------------------------------------------------
        total_forms = db.query(Form).count()
        total_questions = db.query(Question).count()
        total_responses = db.query(Response).count()
        total_completed = db.query(Response).filter(Response.is_complete == True).count()
        f1_total = db.query(Response).filter(Response.form_id == form_1.id).count()
        f1_comp = db.query(Response).filter(Response.form_id == form_1.id, Response.is_complete == True).count()
        f2_total = db.query(Response).filter(Response.form_id == form_2.id).count()
        f2_comp = db.query(Response).filter(Response.form_id == form_2.id, Response.is_complete == True).count()

        f1_rate = (f1_comp / f1_total * 100) if f1_total > 0 else 0.0
        f2_rate = (f2_comp / f2_total * 100) if f2_total > 0 else 0.0
        overall_rate = (total_completed / total_responses * 100) if total_responses > 0 else 0.0

        print("\n============================================================")
        print("SEED SUMMARY")
        print("============================================================")
        print(f"Forms:       {total_forms} (2 published, 1 draft)")
        print(f"Questions:   {total_questions} (Form 1: {len(f1_questions)}, Form 2: {len(f2_questions)}, Form 3: {len(f3_questions)})")
        print(f"Responses:   {total_responses} total (Form 1: {f1_total}, Form 2: {f2_total}, Form 3: 0)")
        print(f"Form 1 Rate: {f1_rate:.1f}% ({f1_comp}/{f1_total} completed, {f1_total - f1_comp} partial)")
        print(f"Form 2 Rate: {f2_rate:.1f}% ({f2_comp}/{f2_total} completed, {f2_total - f2_comp} partial)")
        print(f"Overall:     {overall_rate:.1f}% ({total_completed}/{total_responses} completed)")
        print("============================================================\n")

    finally:
        db.close()


def seed_db_if_empty():
    """Helper invoked on startup to populate database if empty."""
    seed_database(force=False)


if __name__ == "__main__":
    seed_database(force=True)
