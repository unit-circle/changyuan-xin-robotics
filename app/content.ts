export type Project = {
  slug: string;
  label: string;
  title: string;
  shortTitle: string;
  description: string;
  period: string;
  role: string;
  status: string;
  coverImage: string;
  heroImage: string;
  gallery: string[];
  tags: string[];
  challenge: string;
  approach: string[];
  contributions: string[];
  outcomes: string[];
};

export type CourseGroup = {
  slug: string;
  title: string;
  description: string;
  image: string;
  items: string[];
  skills: string[];
  evidence: string[];
  tone: string;
};

export type ResearchOutput = {
  slug: string;
  title: string;
  meta: string;
  status: string;
  image: string;
  summary: string;
  format: string;
};

export const profile = {
  name: "Changyuan Xin",
  chineseName: "辛昌源",
  initials: "XCY",
  role: "Undergraduate Robotics Researcher",
  university: "Northwestern Polytechnical University",
  school: "School of Mechanical Engineering",
  degree: "B.Eng. in Industrial Engineering",
  location: "Xi'an, China",
  availability: "Open to graduate research opportunities",
  focus:
    "Robotic manipulation, reinforcement learning, computer vision, and multi-robot collaborative assembly.",
  quote:
    "Exploring intelligent systems that perceive, learn, and act in the physical world.",
  bio:
    "I am an interdisciplinary undergraduate researcher working at the intersection of robotics, intelligent manufacturing, and artificial intelligence. My experience connects industrial engineering, mechanical design, control, vision, reinforcement learning, and robot simulation.",
  email: "your.email@nwpu.edu.cn",
  scholar: "#",
  github: "#",
  orcid: "#",
  linkedin: "#",
  portrait: "",
};

export const researchInterests = [
  {
    title: "Robotic Manipulation",
    detail: "Motion theory, control, assembly",
    tone: "blue",
  },
  {
    title: "Computer Vision",
    detail: "Perception for robotic systems",
    tone: "cyan",
  },
  {
    title: "Reinforcement Learning",
    detail: "Learning policies and decisions",
    tone: "violet",
  },
  {
    title: "Intelligent Manufacturing",
    detail: "Industrial systems and optimization",
    tone: "purple",
  },
  {
    title: "Multi-Robot Systems",
    detail: "Coordination and collaboration",
    tone: "gold",
  },
] as const;

export const projects: Project[] = [
  {
    slug: "multi-robot-aero-engine-assembly",
    label: "Featured Research",
    title: "Multi-Robot Collaborative Assembly for Aero-engine Blades",
    shortTitle: "Multi-Robot Aero-engine Assembly",
    description:
      "A research direction integrating robot motion, reinforcement learning, vision, and collaborative assembly in Isaac simulation.",
    period: "2025 — Present",
    role: "Undergraduate Researcher",
    status: "Ongoing research",
    coverImage: "/media/robot-factory.jpg",
    heroImage: "/media/robot-factory.jpg",
    gallery: [
      "/media/aircraft-engine.jpg",
      "/media/project-digital.png",
      "/media/robotics.jpg",
    ],
    tags: ["Multi-Robot", "Reinforcement Learning", "Isaac", "Assembly"],
    challenge:
      "Aero-engine blade assembly requires coordinated manipulation under geometric constraints, uncertainty, and strict process requirements. The project explores how multiple robots can share perception, planning, and execution responsibilities.",
    approach: [
      "Model assembly geometry, robot workspaces, and task constraints in simulation.",
      "Study motion-planning and learning-based policies for coordinated manipulation.",
      "Integrate visual information into task-state estimation and closed-loop control.",
      "Evaluate safety, collision avoidance, sequencing, and repeatability.",
    ],
    contributions: [
      "Robot motion-theory study and simulation workflow design",
      "Isaac-based scene construction and experiment organization",
      "Exploration of reinforcement-learning formulations",
      "Multi-robot coordination and assembly-sequence analysis",
    ],
    outcomes: [
      "Reproducible simulation scenes",
      "Experiment records and evaluation plans",
      "Research notes connecting control, learning, and manufacturing",
    ],
  },
  {
    slug: "active-assistive-exoskeleton",
    label: "Innovation Project",
    title: "Active Assistive Exoskeleton Design & Motion Control",
    shortTitle: "Active Assistive Exoskeleton",
    description:
      "Mechanical structure design, motion-control strategy, and dynamic analysis for an active assistive system.",
    period: "College Innovation Project",
    role: "Core Project Member",
    status: "Completed project stage",
    coverImage: "/media/exoskeleton-field.jpg",
    heroImage: "/media/exoskeleton-field.jpg",
    gallery: [
      "/media/mechanical-engineering.jpg",
      "/media/design-prototype.jpg",
      "/media/engineering-lab.jpg",
    ],
    tags: ["Exoskeleton", "Motion Control", "Mechanical Design", "Dynamics"],
    challenge:
      "An assistive exoskeleton must provide useful support while remaining mechanically safe, comfortable, and responsive to human motion.",
    approach: [
      "Translate assistance requirements into mechanical and control constraints.",
      "Develop the structural concept and analyze degrees of freedom.",
      "Study motion-control strategies and human–machine coordination.",
      "Assess loads, dynamics, manufacturability, and iteration priorities.",
    ],
    contributions: [
      "Mechanical structure concept development",
      "Motion-control strategy research",
      "Dynamic analysis and design iteration",
      "Technical documentation and project presentation",
    ],
    outcomes: [
      "System design report",
      "Mechanical concept and control framework",
      "Engineering drawings and analysis records",
    ],
  },
  {
    slug: "robot-motion-isaac-simulation",
    label: "Simulation",
    title: "Robot Motion Theory & Isaac Simulation",
    shortTitle: "Robot Motion & Isaac Simulation",
    description:
      "Simulation workflows for robot modeling, motion planning, testing, and visual evaluation.",
    period: "Research preparation",
    role: "Independent Study",
    status: "Continuously updated",
    coverImage: "/media/project-simulation.png",
    heroImage: "/media/robotic-crawler.jpg",
    gallery: [
      "/media/neural-network-portrait.svg",
      "/media/programming-code.jpg",
      "/media/robotic-crawler.jpg",
    ],
    tags: ["Robot Motion", "Simulation", "Isaac", "Control"],
    challenge:
      "Reliable robot research depends on simulation environments that make assumptions, constraints, and evaluation procedures explicit.",
    approach: [
      "Study kinematics, workspace, trajectory generation, and control.",
      "Build repeatable simulation scenes and parameterized experiments.",
      "Connect perception and control modules through structured workflows.",
      "Record configurations, results, and failure cases for later comparison.",
    ],
    contributions: [
      "Robot modeling and simulation setup",
      "Motion-planning experiment organization",
      "Control and visualization notes",
      "Reproducibility-oriented documentation",
    ],
    outcomes: [
      "Simulation portfolio",
      "Technical notes",
      "Reusable experiment templates",
    ],
  },
  {
    slug: "industrial-iot-decision-systems",
    label: "Research Experience",
    title: "Industrial IoT & Intelligent Decision Systems",
    shortTitle: "Industrial IoT & Decision Systems",
    description:
      "Research exposure to intelligent manufacturing, industrial connectivity, and engineering decision systems.",
    period: "Undergraduate research",
    role: "Research Participant",
    status: "Research experience",
    coverImage: "/media/project-digital.png",
    heroImage: "/media/warehouse-logistics.jpg",
    gallery: [
      "/media/warehouse-logistics.jpg",
      "/media/robotic-crawler.jpg",
      "/media/programming-workstation.jpg",
    ],
    tags: ["Industrial IoT", "Decision Systems", "Digital Twin", "Optimization"],
    challenge:
      "Modern manufacturing systems must connect physical equipment, operational data, and engineering decisions without losing context or traceability.",
    approach: [
      "Study industrial connectivity and data-flow structures.",
      "Relate shop-floor information to decision and optimization models.",
      "Explore digital-twin concepts for monitoring and analysis.",
      "Connect industrial-engineering methods with intelligent systems.",
    ],
    contributions: [
      "Literature and system-architecture research",
      "Industrial decision-process analysis",
      "Cross-disciplinary technical synthesis",
      "Documentation of potential research directions",
    ],
    outcomes: [
      "Research records",
      "Architecture notes",
      "Defined links between industrial engineering and robotics",
    ],
  },
];

export const outputs: ResearchOutput[] = [
  {
    slug: "multi-robot-assembly-record",
    title: "Multi-Robot Assembly Research Record",
    meta: "Ongoing research · methods and experiments",
    status: "In progress",
    image: "/media/aircraft-engine.jpg",
    summary:
      "A structured record of research questions, simulation configurations, methods, and experimental observations.",
    format: "Research notebook",
  },
  {
    slug: "assistive-exoskeleton-report",
    title: "Assistive Exoskeleton Design Report",
    meta: "College innovation project · technical report",
    status: "Project output",
    image: "/media/design-prototype.jpg",
    summary:
      "Technical documentation covering structure, motion strategy, dynamics, and engineering iteration.",
    format: "Technical report",
  },
  {
    slug: "isaac-simulation-notes",
    title: "Isaac Simulation & Robot Control Notes",
    meta: "Simulation record · reproducible workflow",
    status: "Portfolio",
    image: "/media/programming-code.jpg",
    summary:
      "A reproducible collection of simulation, motion-planning, control, and visualization notes.",
    format: "Technical portfolio",
  },
  {
    slug: "engineering-coursework-portfolio",
    title: "Engineering Coursework Portfolio",
    meta: "Selected course projects · reports and code",
    status: "Curating",
    image: "/media/engineering-lab.jpg",
    summary:
      "Selected engineering evidence connecting theoretical courses with analysis, design, and implementation.",
    format: "Coursework collection",
  },
];

export const coursework: CourseGroup[] = [
  {
    slug: "robotics",
    title: "Robotics",
    description:
      "From kinematics and control foundations to integrated robot experiments.",
    image: "/media/nasa-robotic-arm.jpg",
    items: [
      "Robotics Comprehensive Experiment",
      "Robot Control Experiment",
      "Automatic Control",
    ],
    skills: ["Kinematics", "Trajectory Planning", "Control", "Simulation"],
    evidence: ["Experiment reports", "Control notes", "Simulation records"],
    tone: "violet",
  },
  {
    slug: "artificial-intelligence",
    title: "Artificial Intelligence",
    description:
      "Learning methods for perception, decision-making, and intelligent systems.",
    image: "/media/neural-network-portrait.svg",
    items: ["Deep Learning", "Machine Learning", "Reinforcement Learning"],
    skills: ["Modeling", "Learning", "Evaluation", "Data Processing"],
    evidence: ["Model notebooks", "Experiment summaries", "Course projects"],
    tone: "cyan",
  },
  {
    slug: "mechanical-engineering",
    title: "Mechanical Engineering",
    description:
      "Mechanical design, mechanisms, materials, and engineering analysis.",
    image: "/media/mechanical-engineering.jpg",
    items: ["Mechanical Design", "Theory of Machines", "Mechanics of Materials"],
    skills: ["Mechanical Design", "Dynamics", "Strength", "Engineering Drawing"],
    evidence: ["Design calculations", "Drawings", "Mechanism analysis"],
    tone: "blue",
  },
  {
    slug: "industrial-engineering",
    title: "Industrial Engineering",
    description:
      "Optimization and systems thinking for manufacturing and operations.",
    image: "/media/warehouse-logistics.jpg",
    items: [
      "Operations Research",
      "Facility Planning & Logistics",
      "Production Planning",
    ],
    skills: ["Optimization", "Planning", "Logistics", "Decision Analysis"],
    evidence: ["Optimization models", "Planning reports", "System analyses"],
    tone: "purple",
  },
  {
    slug: "programming",
    title: "Programming",
    description:
      "Scientific programming and data workflows for engineering research.",
    image: "/media/programming-code.jpg",
    items: ["Python Data Analysis", "Scientific Computing", "Simulation Tools"],
    skills: ["Python", "Data Analysis", "Visualization", "Reproducibility"],
    evidence: ["Code repositories", "Data notebooks", "Simulation utilities"],
    tone: "cyan",
  },
  {
    slug: "research-tools",
    title: "Research Tools",
    description:
      "Tools and habits that turn experiments into clear, reusable research.",
    image: "/media/digital-twin-architecture.png",
    items: ["Isaac Simulation", "Technical Writing", "Data Visualization"],
    skills: ["Simulation", "Documentation", "Visualization", "Literature Review"],
    evidence: ["Research notes", "Technical figures", "Presentation materials"],
    tone: "gold",
  },
];

export const experiences = [
  {
    period: "Research",
    title: "Undergraduate Research Experience",
    place: "Industrial IoT & Intelligent Decision Institute",
    href: "/research/industrial-iot-decision-systems",
    action: "View related research",
  },
  {
    period: "Innovation",
    title: "Core Project Member",
    place: "Active Assistive Exoskeleton System",
    href: "/research/active-assistive-exoskeleton",
    action: "View innovation project",
  },
  {
    period: "Industry",
    title: "Assistant Engineer Practice",
    place: "Shaanxi Aircraft Industry Corporation (AVIC)",
    href: "/cv#experience",
    action: "View experience",
  },
] as const;

export const resources = [
  {
    title: "Code & Simulation",
    detail: "Project repositories and reproducible workflows",
    image: "/media/warehouse-robot.jpg",
    href: "/resources#code",
  },
  {
    title: "Technical Reports",
    detail: "Research documentation and engineering reports",
    image: "/media/design-prototype.jpg",
    href: "/resources#reports",
  },
  {
    title: "Coursework",
    detail: "Selected course evidence and project files",
    image: "/media/engineering-lab.jpg",
    href: "/coursework",
  },
  {
    title: "CV & Materials",
    detail: "Academic portfolio and application materials",
    image: "/media/programming-workstation.jpg",
    href: "/cv",
  },
] as const;

export const skills = [
  "Python",
  "Robot Simulation",
  "Reinforcement Learning",
  "Computer Vision",
  "Motion Planning",
  "Mechanical Design",
  "Industrial Engineering",
  "Technical Writing",
] as const;
