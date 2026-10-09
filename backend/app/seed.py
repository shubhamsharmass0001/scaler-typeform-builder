"""
seed.py — Database seed script

Seeds realistic initial data for demonstration:
  - Demo Creator user (id=1)
  - Form 1: "Customer Satisfaction Survey" (published, 8 questions using all 8 types, 20 responses)
  - Form 2: "Event Registration" (published, 6 mixed questions, 18 responses)
  - Form 3: "Untitled Draft" (draft, 2 questions, 0 responses)

Idempotent: Only runs if the users table is empty.
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


REALISTIC_RESPONDENTS = [
    {
        "name": "Sarah Jenkins",
        "email": "sarah.jenkins@acmeproducts.io",
        "plan": "opt_2",  # Pro
        "use_case": "opt_2",  # Customer Feedback
        "rating": 5,
        "team_size": 12,
        "recommend": True,
        "feedback": "The keyboard shortcuts and smooth transitions make filling forms feel like a delight.",
        "ticket": "opt_2",  # VIP Pass
        "tracks": ["opt_1", "opt_3"],  # AI & ML, System Design
        "accommodations": False,
        "event_goals": "Looking to meet frontend engineers working on large-scale web applications.",
    },
    {
        "name": "Michael Chang",
        "email": "m.chang@cloudscale.net",
        "plan": "opt_3",  # Enterprise
        "use_case": "opt_1",  # Lead Generation
        "rating": 4,
        "team_size": 45,
        "recommend": True,
        "feedback": "Analytics charts are clean. Would love an automated weekly digest to Slack.",
        "ticket": "opt_1",  # General Admission
        "tracks": ["opt_2", "opt_3"],  # Frontend Architecture, System Design
        "accommodations": False,
        "event_goals": "Excited for the deep dive on state management and caching strategies.",
    },
    {
        "name": "Elena Rossi",
        "email": "elena.rossi@designstudio.it",
        "plan": "opt_2",
        "use_case": "opt_2",
        "rating": 5,
        "team_size": 8,
        "recommend": True,
        "feedback": "The typography presets and theme customization match our brand guidelines effortlessly.",
        "ticket": "opt_2",
        "tracks": ["opt_2"],
        "accommodations": True,
        "event_goals": "Interested in design token sync workflows between Figma and Next.js.",
    },
    {
        "name": "Priya Patel",
        "email": "priya.patel@fintechglobal.com",
        "plan": "opt_3",
        "use_case": "opt_4",  # Research & Surveys
        "rating": 5,
        "team_size": 80,
        "recommend": True,
        "feedback": "High completion rates compared to our previous static forms. Conversion jumped 24%.",
        "ticket": "opt_2",
        "tracks": ["opt_1", "opt_4"],
        "accommodations": False,
        "event_goals": "Connecting with engineering leadership teams scaling multi-tenant APIs.",
    },
    {
        "name": "David Kim",
        "email": "dkim@hypergrowth.co",
        "plan": "opt_1",  # Starter
        "use_case": "opt_1",
        "rating": 4,
        "team_size": 4,
        "recommend": True,
        "feedback": "Super fast onboarding. Had our first waitlist form live within 10 minutes.",
        "ticket": "opt_3",  # Virtual Attendee
        "tracks": ["opt_1"],
        "accommodations": False,
        "event_goals": "Catching keynote recordings and workshop practical exercises remotely.",
    },
    {
        "name": "Jessica Taylor",
        "email": "jtaylor@edulearn.org",
        "plan": "opt_2",
        "use_case": "opt_3",  # Event Registration
        "rating": 4,
        "team_size": 15,
        "recommend": True,
        "feedback": "The CSV export includes full headers and question mappings, saving our ops team hours.",
        "ticket": "opt_1",
        "tracks": ["opt_3", "opt_4"],
        "accommodations": False,
        "event_goals": "Benchmarking our event check-in architecture against modern industry stacks.",
    },
    {
        "name": "Alexander Wright",
        "email": "alex.wright@quantumflow.dev",
        "plan": "opt_2",
        "use_case": "opt_4",
        "rating": 5,
        "team_size": 22,
        "recommend": True,
        "feedback": "Clean REST API and predictable SQLite schema made data pipeline ingestion trivial.",
        "ticket": "opt_2",
        "tracks": ["opt_1", "opt_2", "opt_3"],
        "accommodations": False,
        "event_goals": "Discovering modern tooling paradigms across Next.js and FastAPI ecosystems.",
    },
    {
        "name": "Aisha Al-Mansoor",
        "email": "aisha@venturesync.ae",
        "plan": "opt_3",
        "use_case": "opt_1",
        "rating": 5,
        "team_size": 35,
        "recommend": True,
        "feedback": "Zero friction on mobile browsers. Our international respondents praise the speed.",
        "ticket": "opt_2",
        "tracks": ["opt_4"],
        "accommodations": False,
        "event_goals": "Networking with startup founders and platform builders.",
    },
    {
        "name": "Carlos Gomez",
        "email": "cgomez@medtechpulse.com",
        "plan": "opt_1",
        "use_case": "opt_2",
        "rating": 3,
        "team_size": 6,
        "recommend": False,
        "feedback": "Good experience overall, but would appreciate built-in webhook triggers on response.",
        "ticket": "opt_1",
        "tracks": ["opt_3"],
        "accommodations": True,
        "event_goals": "Learning best practices for high-availability backend microservices.",
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
        "ticket": "opt_3",
        "tracks": ["opt_1"],
        "accommodations": False,
        "event_goals": "Understanding real-world deployment patterns for inference pipelines.",
    },
    {
        "name": "Lucas Morales",
        "email": "lmorales@saasvibe.io",
        "plan": "opt_1",
        "use_case": "opt_1",
        "rating": 4,
        "team_size": 3,
        "recommend": True,
        "feedback": "Intuitive drag-and-drop question reordering in the admin builder.",
        "ticket": "opt_1",
        "tracks": ["opt_2"],
        "accommodations": False,
        "event_goals": "Exploring clean Tailwind design systems and component reusability.",
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
        "ticket": "opt_2",
        "tracks": ["opt_2", "opt_4"],
        "accommodations": False,
        "event_goals": "Learning how top engineering teams maintain consistent design velocity.",
    },
    {
        "name": "Daniel Murphy",
        "email": "dmurphy@bostondata.org",
        "plan": "opt_2",
        "use_case": "opt_4",
        "rating": 4,
        "team_size": 14,
        "recommend": True,
        "feedback": "The response summary breakdown with percentage distributions gives instant insights.",
        "ticket": "opt_1",
        "tracks": ["opt_3"],
        "accommodations": False,
        "event_goals": "Evaluating database indexing patterns for analytical queries.",
    },
    {
        "name": "Zoe Takahashi",
        "email": "zoe@tokyocreative.jp",
        "plan": "opt_2",
        "use_case": "opt_2",
        "rating": 5,
        "team_size": 9,
        "recommend": True,
        "feedback": "Sleek aesthetics and responsive animations match Typeform's signature polish.",
        "ticket": "opt_3",
        "tracks": ["opt_2"],
        "accommodations": False,
        "event_goals": "Studying motion design implementation with Framer Motion in Next.js.",
    },
    {
        "name": "Liam O'Connor",
        "email": "liam.oc@dublintech.ie",
        "plan": "opt_1",
        "use_case": "opt_1",
        "rating": 4,
        "team_size": 5,
        "recommend": True,
        "feedback": "Really appreciate how lightweight the public form loading is — loads in under 200ms.",
        "ticket": "opt_1",
        "tracks": ["opt_1", "opt_2"],
        "accommodations": False,
        "event_goals": "Practical full-stack architecture tips for React and Python projects.",
    },
    {
        "name": "Olivia Bennett",
        "email": "olivia.bennett@apexsystems.com",
        "plan": "opt_3",
        "use_case": "opt_3",
        "rating": 5,
        "team_size": 110,
        "recommend": True,
        "feedback": "The cascade delete safeguards and foreign key enforcement ensure zero orphan data.",
        "ticket": "opt_2",
        "tracks": ["opt_3", "opt_4"],
        "accommodations": False,
        "event_goals": "Meeting fellow directors of engineering navigating platform modernization.",
    },
    {
        "name": "Marcus Johnson",
        "email": "mjohnson@chicagoapps.dev",
        "plan": "opt_2",
        "use_case": "opt_1",
        "rating": 4,
        "team_size": 25,
        "recommend": True,
        "feedback": "Validation messages display immediately when respondents skip required fields.",
        "ticket": "opt_1",
        "tracks": ["opt_1"],
        "accommodations": False,
        "event_goals": "Practical integration of AI capabilities into customer feedback loops.",
    },
    {
        "name": "Ryan Cooper",
        "email": "rcooper@austincapital.com",
        "plan": "opt_1",
        "use_case": "opt_4",
        "rating": 3,
        "team_size": 7,
        "recommend": True,
        "feedback": "Very reliable form builder. Would love multi-page branching logic in the future.",
        "ticket": "opt_1",
        "tracks": ["opt_4"],
        "accommodations": False,
        "event_goals": "Exploring software investing trends in developer productivity tools.",
    },
    {
        "name": "Nathaniel Brooks",
        "email": "nate.brooks@seattlecloud.org",
        "plan": "opt_2",
        "use_case": "opt_2",
        "rating": 5,
        "team_size": 30,
        "recommend": True,
        "feedback": "The drop-off tracking per question made it immediately clear where users lost momentum.",
        "ticket": "opt_2",
        "tracks": ["opt_1", "opt_3"],
        "accommodations": False,
        "event_goals": "Learning distributed data architecture and transactional consistency.",
    },
    {
        "name": "Emma Watson",
        "email": "emma.w@oxfordresearch.ac.uk",
        "plan": "opt_1",
        "use_case": "opt_4",
        "rating": 5,
        "team_size": 11,
        "recommend": True,
        "feedback": "Academic participants found the interface engaging and completed questionnaires quickly.",
        "ticket": "opt_3",
        "tracks": ["opt_1", "opt_4"],
        "accommodations": False,
        "event_goals": "Benchmarking data collection platforms for behavioral research.",
    },
]


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
            print("✓ Database already seeded (users table not empty). Skipping seed.")
            return

        if force:
            print("Force re-seeding: clearing existing data...")
            db.query(Answer).delete()
            db.query(Response).delete()
            db.query(Question).delete()
            db.query(Form).delete()
            db.query(User).delete()
            db.commit()

        # -------------------------------------------------------------------
        # 1. Creator User
        # -------------------------------------------------------------------
        creator = User(
            id=1,
            name="Demo Creator",
            email="creator@example.com",
            created_at=datetime.utcnow() - timedelta(days=30),
        )
        db.add(creator)
        db.commit()
        db.refresh(creator)
        print("✓ Created Demo Creator (id=1, name='Demo Creator', email='creator@example.com')")

        # -------------------------------------------------------------------
        # 2. Form 1: Customer Satisfaction Survey (Published, all 8 types)
        # -------------------------------------------------------------------
        form_1 = Form(
            user_id=creator.id,
            title="Customer Satisfaction Survey",
            description="We'd love to hear your feedback on how we're doing and how we can improve.",
            status=FormStatus.PUBLISHED,
            slug="csat2026",
            theme={
                "backgroundColor": "#FFFFFF",
                "textColor": "#191919",
                "buttonColor": "#0445AF",
                "fontFamily": "Inter",
            },
            welcome_title="Customer Satisfaction Survey",
            welcome_description="Takes 2 minutes. Your feedback directly shapes our product roadmap.",
            welcome_button_text="Start Survey",
            thank_you_title="Thank you for your feedback!",
            thank_you_message="We appreciate your time. Our team reviews every submission.",
            created_at=datetime.utcnow() - timedelta(days=20),
            updated_at=datetime.utcnow() - timedelta(days=15),
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
                description="We'll never send spam",
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
                    "allowOther": True,
                    "multiple": False,
                },
            ),
            Question(
                form_id=form_1.id,
                type=QuestionType.DROPDOWN,
                title="What is your primary use case?",
                description="Choose the one that best describes your workflow",
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
        print(f"✓ Form 1 '{form_1.title}' created with 8 questions (slug: '{form_1.slug}')")

        # -------------------------------------------------------------------
        # 3. Form 2: Event Registration (Published, 6 mixed questions)
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
                "buttonColor": "#4F46E5",
                "fontFamily": "Inter",
            },
            welcome_title="Product & Engineering Summit 2026",
            welcome_description="Join 500+ builders for keynotes, interactive workshops, and networking.",
            welcome_button_text="Register Now",
            thank_you_title="You're registered!",
            thank_you_message="Check your email for your confirmation ticket and calendar invite.",
            created_at=datetime.utcnow() - timedelta(days=18),
            updated_at=datetime.utcnow() - timedelta(days=12),
        )
        db.add(form_2)
        db.flush()

        f2_questions = [
            Question(
                form_id=form_2.id,
                type=QuestionType.SHORT_TEXT,
                title="Full Name",
                description="First and last name as it should appear on your badge",
                required=True,
                position=0,
                properties={"placeholder": "e.g. Alex Morgan"},
            ),
            Question(
                form_id=form_2.id,
                type=QuestionType.EMAIL,
                title="Work Email",
                description="Where we'll send your registration pass",
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
                properties={"placeholder": "e.g. Microfrontends, GraphQL federation, etc."},
            ),
        ]
        db.add_all(f2_questions)
        db.flush()
        print(f"✓ Form 2 '{form_2.title}' created with 6 questions (slug: '{form_2.slug}')")

        # -------------------------------------------------------------------
        # 4. Form 3: Untitled Draft (Draft status, 2 questions)
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
                "buttonColor": "#0445AF",
                "fontFamily": "Inter",
            },
            welcome_title="Team Onboarding Questionnaire",
            welcome_description="A quick checklist for your first week.",
            welcome_button_text="Get Started",
            thank_you_title="All set!",
            thank_you_message="Welcome aboard to the team.",
            created_at=datetime.utcnow() - timedelta(days=2),
            updated_at=datetime.utcnow() - timedelta(days=1),
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
        print(f"✓ Form 3 '{form_3.title}' created (draft, no slug)")

        # -------------------------------------------------------------------
        # 5. Seed Responses for Form 1 (20 responses, ~80% complete, ~20% partial)
        # -------------------------------------------------------------------
        print("Seeding realistic responses for Form 1...")
        for i, data in enumerate(REALISTIC_RESPONDENTS):
            # Timestamp varied over past 14 days
            days_ago = (14 * (i + 1)) / (len(REALISTIC_RESPONDENTS) + 1)
            hours_offset = (i * 3) % 24
            started_time = datetime.utcnow() - timedelta(days=days_ago, hours=hours_offset)

            # ~80% complete (first 16 complete, last 4 partial)
            is_complete = i < 16

            if is_complete:
                submitted_time = started_time + timedelta(minutes=random.randint(1, 4), seconds=random.randint(10, 50))
                drop_off_qid = None
                drop_index = len(f1_questions)
            else:
                submitted_time = None
                # Realistic drop-offs spread across questions 1, 2, 4, 6
                partial_indices = [1, 2, 4, 6]
                drop_index = partial_indices[(i - 16) % len(partial_indices)]
                drop_off_qid = f1_questions[drop_index].id

            resp = Response(
                form_id=form_1.id,
                started_at=started_time,
                submitted_at=submitted_time,
                is_complete=is_complete,
                last_question_id=drop_off_qid,
            )
            db.add(resp)
            db.flush()

            # Answers answered up to the drop-off question
            possible_f1_answers = [
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
                for idx, (qid, val) in enumerate(possible_f1_answers)
                if idx < drop_index
            ]
            db.add_all(answers_to_add)

        print(f"✓ Form 1: Seeded 20 responses (16 complete, 4 partial)")

        # -------------------------------------------------------------------
        # 6. Seed Responses for Form 2 (18 responses, ~80% complete, ~20% partial)
        # -------------------------------------------------------------------
        print("Seeding realistic responses for Form 2...")
        f2_respondents = REALISTIC_RESPONDENTS[:18]
        for i, data in enumerate(f2_respondents):
            days_ago = (13 * (i + 1)) / (len(f2_respondents) + 1)
            hours_offset = (i * 4) % 24
            started_time = datetime.utcnow() - timedelta(days=days_ago, hours=hours_offset)

            # ~80% complete (first 14 complete, last 4 partial)
            is_complete = i < 14
            if is_complete:
                submitted_time = started_time + timedelta(minutes=random.randint(1, 3), seconds=random.randint(15, 45))
                drop_off_qid = None
                drop_index = len(f2_questions)
            else:
                submitted_time = None
                # Realistic drop-offs spread across questions 1, 2, 3, 5
                partial_indices = [1, 2, 3, 5]
                drop_index = partial_indices[(i - 14) % len(partial_indices)]
                drop_off_qid = f2_questions[drop_index].id

            resp = Response(
                form_id=form_2.id,
                started_at=started_time,
                submitted_at=submitted_time,
                is_complete=is_complete,
                last_question_id=drop_off_qid,
            )
            db.add(resp)
            db.flush()

            possible_f2_answers = [
                (f2_questions[0].id, data["name"]),
                (f2_questions[1].id, data["email"]),
                (f2_questions[2].id, data["ticket"]),
                (f2_questions[3].id, data["tracks"]),
                (f2_questions[4].id, data["accommodations"]),
                (f2_questions[5].id, data["event_goals"]),
            ]
            answers_to_add = [
                Answer(response_id=resp.id, question_id=qid, value=val)
                for idx, (qid, val) in enumerate(possible_f2_answers)
                if idx < drop_index
            ]
            db.add_all(answers_to_add)

        print(f"✓ Form 2: Seeded 18 responses (14 complete, 4 partial)")

        db.commit()
        print("\n============================================================")
        print("✓ SEEDING COMPLETED SUCCESSFULLY!")
        print("============================================================")

    finally:
        db.close()


def seed_db_if_empty():
    """Helper invoked on startup to populate database if empty."""
    seed_database(force=False)


if __name__ == "__main__":
    seed_database(force=True)
