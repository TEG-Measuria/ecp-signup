// Generated from core/practices/cg.json (mock data only; the real app receives this from the server).
export default {
 "code": "cg",
 "ref_prefix": "ECP-CG-",
 "name": "Culver & Glass Opticians",
 "short": "Culver & Glass",
 "phone": "01509 212 704",
 "addr": "3 High Street, Loughborough LE11 2PY",
 "reception_email": "reception@culverandglass.co.uk",
 "legal": "Culver & Glass Opticians is a trading name of Glass & Glass Optometrists Ltd. Registered in England No. 05278831.",
 "registered_office": "20 Wenlock Road, London N1 7GU",
 "logo": "assets/cg_primary_charcoal.png",
 "privacy_url": "https://www.glassandglass.co.uk/privacy",
 "booklet_filename": "Eyecare Plan booklet - Culver and Glass.pdf",
 "why": {
  "eyebrow": "Enjoy peace of mind with Eyecare Plan",
  "h1": "You and your family deserve only the best",
  "lead_b": "Join our Gold Eyecare Plan and you'll start seeing benefits right away.",
  "lead": "Come in for £130 worth of top-quality eyecare without reaching for your wallet.",
  "benefits": [
   {
    "t": "Big discounts on glasses and contacts from day one",
    "icon": "<path d=\"M3 12l9-9 9 9-9 9z\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/>"
   },
   {
    "t": "Fast-tracked emergency appointments",
    "icon": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/>"
   },
   {
    "t": "Comprehensive care that's all about you",
    "icon": "<path d=\"M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>"
   },
   {
    "t": "Accidents happen, we've got you covered",
    "icon": "<circle cx=\"6.5\" cy=\"14\" r=\"3.5\"/><circle cx=\"17.5\" cy=\"14\" r=\"3.5\"/><path d=\"M10 14h4M3 14l1-6M21 14l-1-6\"/>"
   }
  ],
  "gold_h": "Gold includes",
  "gold_tag": "All of this for <b>£14 a month</b>",
  "gold": [
   {
    "a": "£50",
    "b": "Comprehensive eye examination"
   },
   {
    "a": "£35",
    "b": "Ultrawide Optomap retinal scans"
   },
   {
    "a": "£45",
    "b": "3D glaucoma & macula scans"
   },
   {
    "a": "£50",
    "b": "Emergency examinations"
   },
   {
    "a": "30% off",
    "b": "Optical & sunglasses frames"
   },
   {
    "a": "20% off",
    "b": "Prescription spectacle lenses"
   },
   {
    "a": "50% off",
    "b": "Additional spectacles within 90 days of your first pair"
   },
   {
    "a": "50% off",
    "b": "Contact lenses"
   },
   {
    "a": "Included",
    "b": "2 year accidental damage spectacle cover"
   }
  ]
 },
 "compare": {
  "tiers": [
   {
    "name": "Without a plan",
    "price": "",
    "mo": "You pay each time",
    "plan": null
   },
   {
    "name": "Essential",
    "price": "£8",
    "mo": "a month",
    "plan": "ess"
   },
   {
    "name": "Gold",
    "price": "£14",
    "mo": "a month",
    "plan": "gold"
   },
   {
    "name": "Contacts",
    "price": "£11",
    "mo": "a month",
    "plan": "cl"
   }
  ],
  "groups": [
   {
    "name": "Eye health",
    "rows": [
     {
      "name": "Comprehensive eye examination",
      "vals": [
       "£50",
       "Covered",
       "Covered",
       "Covered"
      ]
     },
     {
      "name": "Ultrawide Optomap retinal scans",
      "vals": [
       "£35",
       "Covered",
       "Covered",
       "Covered"
      ]
     },
     {
      "name": "3D glaucoma & macula scans",
      "vals": [
       "£45",
       "Covered",
       "Covered",
       "Covered"
      ]
     },
     {
      "name": "Emergency examinations",
      "vals": [
       "£50",
       "Covered",
       "Covered",
       "Covered"
      ]
     },
     {
      "name": "Glaucoma eye pressure phasing",
      "vals": [
       "£30",
       "Covered",
       "Covered",
       "Covered"
      ]
     }
    ]
   },
   {
    "name": "Contact lenses",
    "rows": [
     {
      "name": "Contact lens fitting & trials",
      "vals": [
       "£75",
       "£25",
       "Covered",
       "Covered"
      ]
     },
     {
      "name": "Contact lens check ups",
      "vals": [
       "£60",
       "£20",
       "Covered",
       "Covered"
      ]
     },
     {
      "name": "Contact lenses",
      "vals": [
       "–",
       "–",
       "50% off",
       "50% off"
      ]
     },
     {
      "name": "Care products",
      "vals": [
       "–",
       "–",
       "20% off",
       "20% off"
      ]
     }
    ]
   },
   {
    "name": "Glasses",
    "rows": [
     {
      "name": "Frames (optical & sunglasses)",
      "vals": [
       "–",
       "–",
       "30% off",
       "–"
      ]
     },
     {
      "name": "Prescription spectacle lenses",
      "vals": [
       "–",
       "–",
       "20% off",
       "–"
      ]
     },
     {
      "name": "Additional spectacles within 90 days",
      "vals": [
       "–",
       "–",
       "50% off",
       "–"
      ]
     },
     {
      "name": "2 year accidental damage spectacle cover",
      "vals": [
       "–",
       "–",
       "Included",
       "–"
      ]
     }
    ]
   },
   {
    "name": "Family",
    "rows": [
     {
      "name": "Family cover, extra a month (2 adults, 2 children)",
      "vals": [
       "–",
       "+£6",
       "+£12",
       "–"
      ]
     }
    ]
   }
  ]
 },
 "plans": [
  {
   "code": "gold",
   "name": "Gold",
   "short": "Gold",
   "price": "£14",
   "pence": 1400,
   "desc": "Full Clinical Cover & Preferential Pricing on all products",
   "best": true,
   "family": false,
   "payroll_group": "gold",
   "form_box": "opt_gold",
   "glasses_cover": true
  },
  {
   "code": "goldfam",
   "name": "Gold Family Child Cover",
   "short": "Gold Family",
   "price": "£26",
   "pence": 2600,
   "desc": "Full Clinical Cover & Preferential Pricing on all products (same address). Up to two adults and two children; a child is under 16, or 16 to 18 in full-time education",
   "best": false,
   "family": true,
   "payroll_group": "goldfam",
   "form_box": "opt_gold_family",
   "glasses_cover": true
  },
  {
   "code": "ess",
   "name": "Essential",
   "short": "Essential",
   "price": "£8",
   "pence": 800,
   "desc": "Full Clinical Cover; contact lens fitting & check ups at member rates",
   "best": false,
   "family": false,
   "payroll_group": "other",
   "form_box": "opt_essentials",
   "glasses_cover": false
  },
  {
   "code": "essfam",
   "name": "Essential Family Child Cover",
   "short": "Essential Family",
   "price": "£14",
   "pence": 1400,
   "desc": "Full Clinical Cover; contact lens fitting & check ups at member rates (same address). Up to two adults and two children; a child is under 16, or 16 to 18 in full-time education",
   "best": false,
   "family": true,
   "payroll_group": "other",
   "form_box": "opt_ess_family",
   "glasses_cover": false
  },
  {
   "code": "cl",
   "name": "Contacts",
   "short": "Contacts",
   "price": "£11",
   "pence": 1100,
   "desc": "Full Clinical Cover & Preferential Pricing on contact lens and care products only",
   "best": false,
   "family": false,
   "payroll_group": "other",
   "form_box": "opt_contacts",
   "glasses_cover": false
  }
 ],
 "key_terms": [
  {
   "h": "Your plan",
   "x": "Gold, £14 a month by Direct Debit, taken around the 1st or 15th of each month."
  },
  {
   "h": "How long",
   "x": "A minimum term of 18 months. Each time you receive preferential pricing on a product or service, the agreement extends for another 12-month minimum term. After that it carries on month by month until you or we end it."
  },
  {
   "h": "Ending it",
   "x": "After the minimum term, give 30 days' written notice by email or letter to this practice. Fees already paid are not refunded."
  },
  {
   "h": "Ending early",
   "x": "If you end it within a minimum term, you repay any upfront discounts received in the previous 12 months, or the remainder of the 12-month term's monthly payments, within 30 days. Debt collection costs may also be payable."
  },
  {
   "h": "Changing plan",
   "x": "Upgrade at any time. Downgrade only after the first 18 months, and not during a 12-month extension. Any change starts a new 12-month minimum term."
  },
  {
   "h": "Family cover",
   "x": "Up to two adults and two children living at the same address. A child is under 16, or 16 to 18 and in full-time education. A child who leaves full-time education or turns 19 needs their own plan."
  },
  {
   "h": "Missed payment",
   "x": "We will contact you within 7 days to sort it out. If it is still not paid, your benefits are suspended and the plan may be ended. A £25 administration fee may be charged."
  },
  {
   "h": "Glasses cover",
   "x": "Gold includes 2 years' accidental damage cover on glasses bought under the plan, while you remain a member and are up to date with your payments."
  }
 ],
 "agree": "By signing, I hereby acknowledge that I have completely read and fully understand the terms and conditions related to Eyecare Plan membership and that I consent for payments to be collected directly from my bank via direct debit in accordance with these terms and conditions.",
 "agree_u16": "I recognise and agree to be bound by this agreement on behalf of the patient, myself, and all other parents or guardians of the patient.",
 "terms_full": [
  {
   "k": "h",
   "x": "TERMS AND CONDITIONS"
  },
  {
   "k": "p",
   "x": "Thank you for choosing to join our Eyecare Plan. This membership programme is designed to provide you with exceptional clinical care, access to advanced diagnostic services, and exclusive preferential pricing on a wide range of optical products. To ensure transparency and help you make the most of your plan, we’ve outlined the full terms and conditions below. These details explain your entitlements, responsibilities, and the many benefits included with your membership. If you have any questions or need further assistance, please don’t hesitate to contact us."
  },
  {
   "k": "h",
   "x": "MINIMUM CONTRACT PERIOD"
  },
  {
   "k": "p",
   "x": "It is hereby agreed and understood that the membership programme is designed for loyal patients only. It has been constructed to help loyal clients manage the costs of their optical products and clinical care, and it is understood that it is not a payment plan option, financial savings account, or insurance-based product."
  },
  {
   "k": "p",
   "x": "As you are enjoying the benefits of the Eyecare Plan immediately, there is a minimum subscription of 18 months. After the 18 months, your membership carries on month by month until you or we end it (see Cancellation Policy)."
  },
  {
   "k": "s",
   "x": "ADDITIONAL PAIRS OF GLASSES"
  },
  {
   "k": "b",
   "x": "Additional pairs of glasses (including lenses) purchased within 90 days of the initial pair will qualify for a 50% preferential price reduction (frame & lenses)."
  },
  {
   "k": "b",
   "x": "Additional pairs of glasses purchased outside of the initial 90 days will fall in line with the standard preferential pricing structure of the given Eyecare Plan."
  },
  {
   "k": "h",
   "x": "DIRECT DEBIT PAYMENTS"
  },
  {
   "k": "p",
   "x": "Direct Debits are collected by GoCardless Ltd, a Bacs-approved payment provider, on behalf of Glass & Glass Optometrists Limited."
  },
  {
   "k": "p",
   "x": "In the event of a failed Direct Debit payment, the member will be contacted to resolve the issue within 7 days. If payment is not received after this period, membership benefits will be suspended, and the agreement may be terminated with immediate effect."
  },
  {
   "k": "h",
   "x": "CANCELLATION POLICY"
  },
  {
   "k": "p",
   "x": "It is agreed that should the member wish to cancel the membership agreement after the 18-month minimum term, the member must do so by giving 30 days' written notice via email or letter to the practice address and location where they signed up. The member will not be eligible for any form of monetary refund of membership payments after cancellation."
  },
  {
   "k": "p",
   "x": "It is hereby agreed that either party will have the option at the end of the minimum term to either renew or cancel the membership agreement. It is understood that all benefits and entitlements will be null and void effective immediately upon cancellation. The member will not be eligible for any form of monetary refund of membership payments after cancellation."
  },
  {
   "k": "p",
   "x": "It is agreed that should the practice wish to cancel the membership agreement at any point, they must do so by giving 30 days' written notice via email or letter. This is to be delivered to the registered contact details held for the member at the time of this agreement. It is the responsibility of the member to inform the practice of any change in contact details."
  },
  {
   "k": "h",
   "x": "ACKNOWLEDGEMENT AND PAYMENT TERMS"
  },
  {
   "k": "p",
   "x": "Upon signing and commencing your direct debit payments, it is understood that the member has read, understood, and agreed to the terms and conditions herewith."
  },
  {
   "k": "p",
   "x": "Upon signing herewith, it is deemed that the member has confirmed and accepted the choice of monthly direct-debit membership fee, agreed to the minimum contract period described above. It should be noted that once the member receives preferential pricing towards any product or service (including any said clinical services), the agreement will automatically be extended for another 12-month minimum term."
  },
  {
   "k": "p",
   "x": "The member has confirmed their agreement that a monthly direct debit will be taken from their personal current account around the 1st or 15th of each calendar month."
  },
  {
   "k": "p",
   "x": "The member has understood and agreed that should they fall behind with their membership fees due to an inability for us to collect their direct debit payments, we reserve the right to charge a £25 administration fee, suspend and/or cancel the membership agreement, with no refund of previous fees paid, and with the immediate cessation of all membership benefits. However, you will still be liable for any outstanding sums. Your Accidental Damage Cover will automatically terminate as a result of non-payment."
  },
  {
   "k": "h",
   "x": "PREMATURE CANCELLATION AND LIABILITY"
  },
  {
   "k": "p",
   "x": "Should the member force cancellation prematurely outside of any 12-month rolling period where a benefit has been received, or within the initial 18-month minimum term period, they will be held financially liable and required to:"
  },
  {
   "k": "b",
   "x": "Repay for any upfront discounts received during the previous 12 months, or"
  },
  {
   "k": "b",
   "x": "Repay the remainder of the 12-month term's monthly payments, within 30 days of forced cancellation."
  },
  {
   "k": "p",
   "x": "If debt collection services are appointed, the legal costs from both parties associated with debt collection following unauthorised and non-communicated cancellation will also be payable by the member."
  },
  {
   "k": "h",
   "x": "VARIATION OF TERMS"
  },
  {
   "k": "p",
   "x": "We reserve the right to change the fundamentals of the scheme and its conditions without notice. Copies of such conditions will be made available in practice and on the company website. Alteration of the monthly fee may occur at any time, and at least two weeks’ notice will be given to any member affected."
  },
  {
   "k": "h",
   "x": "ACCIDENTAL DAMAGE COVER"
  },
  {
   "k": "p",
   "x": "Claims for accidental breakage cover for prescription glasses must be made within 24 months of purchase to qualify for preferential rates. Any replacement prescription glasses will always be made to the same prescription as the original order."
  },
  {
   "k": "p",
   "x": "Your Accidental Damage Cover begins automatically from the date when you collect your new spectacles."
  },
  {
   "k": "p",
   "x": "It covers all spectacles purchased under the scheme for two years from the original date of purchase, provided you remain a member of the Eyecare Plan and are up to date with your payments. Should you choose to terminate your contract, your Accidental Damage Cover will end with immediate effect."
  },
  {
   "k": "p",
   "x": "Your Accidental Damage Cover does not cover loss or fair wear and tear. This means that you are able to make a claim provided all the following conditions are met:"
  },
  {
   "k": "b",
   "x": "Your spectacles show visible signs of damage not due to fair wear or neglect."
  },
  {
   "k": "b",
   "x": "All parts of the damaged spectacles are brought in (e.g., sides, screws, lenses)."
  },
  {
   "k": "b",
   "x": "You make your claim within three months of the accident occurring."
  },
  {
   "k": "p",
   "x": "We will repair or replace your damaged spectacles as deemed necessary. In the event of a duplicate frame or lens being unavailable, you will be required to purchase new spectacles. In this instance, you will be given a credit balance of 50% of the original purchase price towards the purchase of new prescription glasses. You will then be free to choose a replacement pair of glasses. Any replacement prescription glasses will always be made to the same prescription as the original order."
  },
  {
   "k": "h",
   "x": "DEFINITIONS"
  },
  {
   "k": "d",
   "t": "Entitlement:",
   "x": "Services or benefits that are fully covered under the plan without additional charges, as listed herein."
  },
  {
   "k": "d",
   "t": "Access:",
   "x": "Discounts, offers, or preferential pricing available to members that require payment at a reduced rate."
  },
  {
   "k": "d",
   "t": "Clinical Necessity:",
   "x": "Determined by the optometrist based on your medical needs and clinical assessment, guiding the frequency of appointments and tests."
  },
  {
   "k": "d",
   "t": "Reasonable Usage:",
   "x": "The expected and fair use of membership benefits based on clinical needs and standard optometric care practices."
  },
  {
   "k": "h",
   "x": "REASONABLE USAGE OF SERVICES"
  },
  {
   "k": "p",
   "x": "Membership benefits are provided for reasonable usage, which is defined as the clinically necessary and fair use of entitlements and access-based benefits. Excessive or unreasonable usage beyond standard care may result in a review of the membership agreement, with possible limitations or termination of benefits at the practice’s discretion."
  },
  {
   "k": "h",
   "x": "NHS-FUNDED SERVICES"
  },
  {
   "k": "p",
   "x": "If the ECP member is eligible for NHS-funded eye tests, the practice will claim the NHS fee for the basic examination on the member’s behalf where applicable. Your ECP membership will cover additional tests not covered by the NHS alongside your other entitlements to ensure consistent and frequent care. The membership fee applies to additional private services and benefits not provided under NHS care, including but not limited to:"
  },
  {
   "k": "b",
   "x": "Advanced diagnostic scans such as Ultrawide Optomap and 3D Glaucoma and Macula scans."
  },
  {
   "k": "b",
   "x": "Longer appointment durations tailored to clinical needs."
  },
  {
   "k": "b",
   "x": "Unlimited access to emergency consultations based on clinical necessity."
  },
  {
   "k": "b",
   "x": "Preferential pricing on additional pairs of spectacles, lenses, and care products."
  },
  {
   "k": "p",
   "x": "The practice reserves the right to determine, at its discretion, whether an eye examination is processed as part of the Eyecare Plan benefit or as an NHS-funded claim. This decision will be based on clinical factors, patient eligibility, and the scope of the examination required. Members of the Eyecare Plan also enjoy significant additional benefits, including preferential pricing on optical products, access to exclusive discounts, and extended clinical services not covered by the NHS."
  },
  {
   "k": "p",
   "x": "Billing transparency will be ensured, with NHS-funded services clearly separated from private services and benefits."
  },
  {
   "k": "h",
   "x": "FAMILY COVER"
  },
  {
   "k": "p",
   "x": "Family cover is for up to two adults and two children living at the same address. A child is under 16, or 16 to 18 and in full-time education. A child who leaves full-time education or turns 19 needs their own plan."
  },
  {
   "k": "h",
   "x": "UPGRADE AND DOWNGRADE OPTIONS"
  },
  {
   "k": "p",
   "x": "Members may upgrade their plan at any time. Members may downgrade their plan only after the initial 18-month term, and not during any rolling 12-month extension. Any upgrade or downgrade starts a new minimum term of 12 months from the date of the change."
  },
  {
   "k": "h",
   "x": "DISPUTE RESOLUTION"
  },
  {
   "k": "p",
   "x": "In the event of a dispute regarding this agreement, the member agrees to attempt to resolve the matter directly with the practice. If the dispute cannot be resolved informally, both parties agree to pursue mediation before pursuing legal remedies."
  },
  {
   "k": "h",
   "x": "TERMINATION FOR BREACH"
  },
  {
   "k": "p",
   "x": "The practice reserves the right to terminate membership immediately in cases of non-compliance with these terms, inappropriate behaviour towards staff, or fraudulent activity."
  },
  {
   "k": "h",
   "x": "FORCE MAJEURE"
  },
  {
   "k": "p",
   "x": "The practice shall not be held liable for any failure to provide services due to circumstances beyond its reasonable control, including but not limited to natural disasters, pandemics, or governmental restrictions."
  },
  {
   "k": "h",
   "x": "DATA PROTECTION AND PRIVACY"
  },
  {
   "k": "p",
   "x": "The practice will handle all member information in accordance with the General Data Protection Regulation (GDPR). Personal and payment details will be used solely for the administration of the Eyecare Plan and will not be shared with third parties without consent, except as required by law."
  }
 ]
};
