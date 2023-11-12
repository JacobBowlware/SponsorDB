import { useState } from 'react';

import AccordianItem from './AccordianItem';

const FAQAccordian = () => {
    const [acc1Open, setAcc1Open] = useState(false);
    const [acc2Open, setAcc2Open] = useState(false);
    const [acc3Open, setAcc3Open] = useState(false);
    const [acc4Open, setAcc4Open] = useState(false);
    const [acc5Open, setAcc5Open] = useState(false);
    return (
        <div className="faq-accordian__container">
            <AccordianItem
                title="How much does SponsorTrail cost?"
                content="We are currently finalizing our pricing plans to offer our customers the best value. We will notify you when we have finalized our pricing plans."
                onPress={() => setAcc1Open(!acc1Open)}
                isOpen={acc1Open}
            />
            <AccordianItem
                title="How often will I receive curated sponsorship lists?"
                content="We aim to provide you with fresh and relevant sponsorship opportunities regularly. You can expect to receive curated lists every week, ensuring you have access to the latest and most valuable opportunities for your podcast."
                onPress={() => setAcc2Open(!acc2Open)}
                isOpen={acc2Open}
            />
            <AccordianItem
                title="How do I apply for sponsorships?"
                content="Once you receive your curated list of potential sponsors, reaching out to them is easy. We provide you with the necessary contact information and guidelines on how to approach these companies to explore sponsorship opportunities for your podcast."
                onPress={() => setAcc3Open(!acc3Open)}
                isOpen={acc3Open}
            />
            <AccordianItem
                title="Are the sponsorships suitable for any podcast size?"
                content="Yes! SponsorTrail caters to podcasts of all sizes. Whether you're just starting or already have a substantial audience, our curated lists include opportunities that match the scale and scope of your podcast."
                onPress={() => setAcc4Open(!acc4Open)}
                isOpen={acc4Open}
            />
        </div>
    );
}

export default FAQAccordian;