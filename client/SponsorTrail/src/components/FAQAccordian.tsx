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
                title="How can I apply for sponsorships?"
                content="Depending on the sponsor, you may be able to apply directly through their website. If you're interested in a company that doesn't have an application process, we recommend reaching out to them directly!"
                onPress={() => setAcc3Open(!acc3Open)}
                isOpen={acc3Open}
            />
            <AccordianItem
                title="Am I guaranteed a sponsorship?"
                content="We can't guarantee sponsorships, however, the companies we curate have demonstrated an interest in this type of advertising in the past and may be open to future opportunities."
                onPress={() => setAcc4Open(!acc4Open)}
                isOpen={acc4Open}
            />
            <AccordianItem
                title="How do we gather our data?"
                content="We gather our data directly from reliable sources and content creators in your niche. Our process ensures that the information provided is accurate and up-to-date."
                onPress={() => setAcc5Open(!acc5Open)}
                isOpen={acc5Open}
            />
            <AccordianItem
                title="How often is the database updated?"
                content="Our database is updated weekly, ensuring that you have access to the most current information."
                onPress={() => setAcc2Open(!acc2Open)}
                isOpen={acc2Open}
            />
        </div>
    );
}

export default FAQAccordian;