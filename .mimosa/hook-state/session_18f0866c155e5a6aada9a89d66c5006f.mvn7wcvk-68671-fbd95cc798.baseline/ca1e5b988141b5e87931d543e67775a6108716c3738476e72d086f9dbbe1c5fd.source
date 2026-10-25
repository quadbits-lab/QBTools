import type { ToolDef } from "../types";

export const calculatorTools: ToolDef[] = [
	{
		slug: "age-calculator",
		category: "calculators",
		name: "Age Calculator",
		title: "Age Calculator — Exact Age in Years, Months & Days",
		tagline: "Find your exact age and count down to your next birthday.",
		description:
			"Calculate exact age in years, months and days from a date of birth, plus total days lived and days until your next birthday. Free.",
		icon: "cake",
		keywords: [
			"age calculator",
			"how old am i",
			"date of birth calculator",
			"age in days",
			"next birthday",
		],
		howTo: [
			{ title: "Enter date of birth", text: "Pick the day you were born." },
			{
				title: "Optional: change the “as of” date",
				text: "Leave it as today, or pick a date like an exam deadline.",
			},
			{
				title: "See your age",
				text: "Years, months, days, and your next birthday appear instantly.",
			},
		],
		about: {
			what: "The age calculator finds the exact time between two dates, counting real month lengths and leap years, so the result matches what forms expect.",
			when: [
				"A form asks for your age on a specific date.",
				"Checking eligibility for an exam or job age limit.",
				"Curious how many days old you are.",
			],
		},
		faqs: [
			{
				q: "Does it count leap years?",
				a: "Yes. The calculation uses the real calendar, including leap years and different month lengths.",
			},
			{
				q: "What if I was born on 29 February?",
				a: "In non-leap years, your birthday is counted as 28 February.",
			},
		],
		related: ["bmi-calculator", "percentage-calculator", "gpa-calculator"],
		runtime: "browser",
		popular: 10,
	},
	{
		slug: "emi-calculator",
		category: "calculators",
		name: "EMI Calculator",
		title: "EMI Calculator — Loan EMI, Interest & Amortization",
		tagline: "See your monthly loan payment and total interest.",
		description:
			"Calculate monthly EMI for home, car or personal loans with total interest and a month-by-month repayment schedule. Free and simple.",
		icon: "landmark",
		keywords: [
			"emi calculator",
			"loan calculator",
			"home loan emi",
			"car loan emi",
			"personal loan",
			"amortization",
			"interest",
		],
		howTo: [
			{ title: "Enter loan amount", text: "Type how much you want to borrow." },
			{ title: "Add rate and tenure", text: "Enter the yearly interest rate and the loan length." },
			{
				title: "See the breakdown",
				text: "Get the EMI, total interest and full repayment schedule.",
			},
		],
		about: {
			what: "EMI (Equated Monthly Instalment) is the fixed amount you pay each month on a loan. It covers both interest and part of the loan itself. Early payments are mostly interest; later ones are mostly principal.",
			when: [
				"Comparing home, car or personal loan offers.",
				"Checking whether a monthly payment fits your budget.",
				"Seeing how a shorter tenure saves interest.",
			],
		},
		faqs: [
			{
				q: "What formula is used?",
				a: "EMI = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1), where P is the loan amount, r the monthly interest rate and n the number of months.",
			},
			{
				q: "Does this include processing fees?",
				a: "No. Banks may add fees, insurance or taxes. Ask your lender for the full cost.",
			},
			{
				q: "Is this financial advice?",
				a: "No. Results are estimates for planning only. Confirm figures with your lender.",
			},
		],
		related: ["percentage-calculator", "age-calculator", "invoice-generator"],
		runtime: "browser",
		popular: 11,
	},
	{
		slug: "percentage-calculator",
		category: "calculators",
		name: "Percentage Calculator",
		title: "Percentage Calculator — % of, Increase & Decrease",
		tagline: "Work out percentages, discounts and changes fast.",
		description:
			"Find X% of a number, what percent one number is of another, and percentage increase or decrease. Free percentage calculator with steps.",
		icon: "percent",
		keywords: [
			"percentage calculator",
			"percent of",
			"percentage increase",
			"percentage decrease",
			"discount calculator",
			"marks percentage",
		],
		howTo: [
			{ title: "Pick a question", text: "Choose what you want to find out." },
			{ title: "Enter numbers", text: "Type the two numbers." },
			{ title: "Read the answer", text: "See the result and how it was worked out." },
		],
		about: {
			what: "A percentage is a part out of 100. This calculator handles the three most common questions and shows the working, so it's great for homework too.",
			when: [
				"Working out a shop discount.",
				"Turning exam marks into a percentage.",
				"Seeing how much a price or salary changed.",
			],
		},
		faqs: [
			{
				q: "How do I calculate marks percentage?",
				a: "Divide marks obtained by total marks and multiply by 100. Use “X is what % of Y”.",
			},
			{
				q: "What's the difference between percent change and percentage points?",
				a: "Going from 10% to 15% is a 5 percentage-point rise, but a 50% increase.",
			},
		],
		related: ["gpa-calculator", "emi-calculator", "bmi-calculator"],
		runtime: "browser",
		popular: 12,
	},
	{
		slug: "gpa-calculator",
		category: "calculators",
		name: "GPA Calculator",
		title: "GPA Calculator — Semester GPA & CGPA",
		tagline: "Add your courses and grades to get your GPA.",
		description:
			"Calculate semester GPA and cumulative CGPA on a 4.0 or 10-point scale with credit hours. Free, simple and works on phone.",
		icon: "graduation-cap",
		keywords: ["gpa calculator", "cgpa calculator", "grade point average", "4.0 scale", "10 point"],
		howTo: [
			{ title: "Choose a scale", text: "Pick 4.0 or 10-point grading." },
			{ title: "Add courses", text: "Enter each course's credits and grade." },
			{
				title: "See your GPA",
				text: "Your GPA updates as you go. Add previous CGPA to get the cumulative result.",
			},
		],
		about: {
			what: "GPA is the average of your grade points weighted by course credits. Courses with more credits count more toward the result.",
			when: [
				"Checking your semester result before it's published.",
				"Planning which grades you need to reach a target.",
				"Filling in applications that ask for CGPA.",
			],
		},
		faqs: [
			{
				q: "How is GPA calculated?",
				a: "Multiply each grade point by its credits, add them up, then divide by total credits.",
			},
			{
				q: "My university uses a different scale.",
				a: "Grade points can be edited per course, so you can match your university's table.",
			},
		],
		related: ["percentage-calculator", "age-calculator", "word-counter"],
		runtime: "browser",
	},
	{
		slug: "bmi-calculator",
		category: "calculators",
		name: "BMI Calculator",
		title: "BMI Calculator — Body Mass Index (kg/cm or lb/ft)",
		tagline: "Check your BMI with metric or imperial units.",
		description:
			"Calculate Body Mass Index from height and weight in kg/cm or lb/ft-in, with the healthy weight range for your height. Free.",
		icon: "heart-pulse",
		keywords: ["bmi calculator", "body mass index", "healthy weight", "bmi kg", "bmi chart"],
		howTo: [
			{ title: "Choose units", text: "Metric (kg, cm) or Imperial (lb, ft, in)." },
			{ title: "Enter height & weight", text: "Type your height and weight." },
			{ title: "See your BMI", text: "Get your BMI, category and healthy weight range." },
		],
		about: {
			what: "BMI compares weight to height (kg ÷ m²). It's a quick screening number used by doctors, but it doesn't measure body fat directly and isn't a diagnosis.",
			when: [
				"Tracking a fitness or weight goal.",
				"Filling in a health or insurance form.",
				"Getting a rough idea of a healthy weight for your height.",
			],
		},
		faqs: [
			{
				q: "Is BMI accurate for everyone?",
				a: "No. Athletes, older adults and pregnant people may get misleading results. Talk to a doctor for advice.",
			},
			{
				q: "Can children use this?",
				a: "Children and teens need age- and sex-specific BMI charts. This calculator is for adults 18+.",
			},
		],
		related: ["age-calculator", "percentage-calculator", "emi-calculator"],
		runtime: "browser",
	},
];
