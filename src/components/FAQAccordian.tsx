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
                title="What is the cost of SponsorTrail?"
                content="We're finalizing our pricing plans to ensure the best value for our customers. You'll be notified once we have finalized our pricing."
                onPress={() => setAcc1Open(!acc1Open)}
                isOpen={acc1Open}
            />
            <AccordianItem
                title="How often do I receive curated sponsorship lists?"
                content="Expect fresh and relevant sponsorship opportunities delivered weekly. Our curated lists provide access to the latest and most valuable opportunities for your podcast."
                onPress={() => setAcc2Open(!acc2Open)}
                isOpen={acc2Open}
            />
            <AccordianItem
                title="How can I apply for sponsorships?"
                content="Upon receiving your curated list, reaching out to potential sponsors is hassle-free. We provide contact information and guidelines for approaching these companies."
                onPress={() => setAcc3Open(!acc3Open)}
                isOpen={acc3Open}
            />
            <AccordianItem
                title="Are the sponsorships suitable for any podcast size?"
                content="Yes, SponsorTrail caters to podcasts of various sizes, aligning opportunities with your podcast's scale and scope. However, it's essential to note that sponsorships often require a certain audience threshold. While this can vary, typically, companies may consider sponsorships for podcasts with a consistent audience size of several thousand listeners or more."
                onPress={() => setAcc4Open(!acc4Open)}
                isOpen={acc4Open}
            />
            <AccordianItem
                title="How do we gather our data?"
                content="We collect data from various trusted sources across the web, aggregating information on proven podcast sponsorships. Our team meticulously reviews and selects sponsorship opportunities, ensuring only reputable companies with a strong sponsorship history are included in your tailored list.
                "
                onPress={() => setAcc5Open(!acc5Open)}
                isOpen={acc5Open}
            />
        </div>
    );
}

export default FAQAccordian;