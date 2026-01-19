import { CEFRLevel, Part, QuestionType } from '@/types/cefr';

// Comprehensive passages for different levels and topics
const passages: Record<CEFRLevel, Array<{
  title: string;
  content: string;
  paragraphs: Array<{ label: string; text: string }>;
  topic: string;
  difficulty: number;
}>> = {
  A1: [
    {
      title: 'My Daily Routine',
      topic: 'daily-life',
      difficulty: 1,
      content: `I wake up at 7 o'clock every morning. First, I brush my teeth and wash my face. Then I have breakfast. I usually eat bread and drink milk. After breakfast, I go to school by bus.

School starts at 8:30. I study many subjects like English, math, and science. My favorite subject is English because I like learning new words.

At lunchtime, I eat in the school cafeteria. I often have rice and vegetables. Sometimes I eat chicken too.

After school, I go home and do my homework. Then I play with my friends in the park. We like to play football.

In the evening, I have dinner with my family. We talk about our day. After dinner, I watch TV or read books.

I go to bed at 9 o'clock. I always sleep well because I am tired after a busy day.`,
      paragraphs: [
        { label: 'A', text: `I wake up at 7 o'clock every morning. First, I brush my teeth and wash my face. Then I have breakfast. I usually eat bread and drink milk. After breakfast, I go to school by bus.` },
        { label: 'B', text: `School starts at 8:30. I study many subjects like English, math, and science. My favorite subject is English because I like learning new words.` },
        { label: 'C', text: `At lunchtime, I eat in the school cafeteria. I often have rice and vegetables. Sometimes I eat chicken too.` },
        { label: 'D', text: `After school, I go home and do my homework. Then I play with my friends in the park. We like to play football.` },
        { label: 'E', text: `In the evening, I have dinner with my family. We talk about our day. After dinner, I watch TV or read books.` },
        { label: 'F', text: `I go to bed at 9 o'clock. I always sleep well because I am tired after a busy day.` },
      ],
    },
    {
      title: 'The Pet Shop',
      topic: 'animals',
      difficulty: 1,
      content: `The pet shop on Main Street sells many animals. There are dogs, cats, birds, and fish. The shop is open every day from 9 am to 6 pm.

Mr. Brown owns the pet shop. He is a kind man who loves animals. He feeds all the animals every morning.

The dogs are in the front of the shop. There are big dogs and small dogs. The puppies are very cute and playful.

The cats sleep in comfortable beds. They have soft fur. Some cats are black, some are white, and some are orange.

The birds sing beautiful songs. They live in cages with food and water. The parrots can say "hello" and "goodbye."

Many children visit the pet shop after school. They like to look at the animals. Some families buy pets to take home.`,
      paragraphs: [
        { label: 'A', text: `The pet shop on Main Street sells many animals. There are dogs, cats, birds, and fish. The shop is open every day from 9 am to 6 pm.` },
        { label: 'B', text: `Mr. Brown owns the pet shop. He is a kind man who loves animals. He feeds all the animals every morning.` },
        { label: 'C', text: `The dogs are in the front of the shop. There are big dogs and small dogs. The puppies are very cute and playful.` },
        { label: 'D', text: `The cats sleep in comfortable beds. They have soft fur. Some cats are black, some are white, and some are orange.` },
        { label: 'E', text: `The birds sing beautiful songs. They live in cages with food and water. The parrots can say "hello" and "goodbye."` },
        { label: 'F', text: `Many children visit the pet shop after school. They like to look at the animals. Some families buy pets to take home.` },
      ],
    },
    {
      title: 'A Trip to the Beach',
      topic: 'travel',
      difficulty: 1,
      content: `Last summer, my family went to the beach. We left early in the morning. The drive took two hours.

When we arrived, I could see the blue ocean. The sand was warm and soft. I took off my shoes and ran to the water.

My dad helped me build a sandcastle. We used a bucket and a small shovel. The sandcastle was very big.

My mom sat under an umbrella. She read a book and watched us play. She put sunscreen on my face so I wouldn't get sunburned.

For lunch, we ate sandwiches and fruit. I drank cold juice. The food tasted extra good at the beach.

We stayed until the sun started to go down. I was tired but happy. It was the best day of summer!`,
      paragraphs: [
        { label: 'A', text: `Last summer, my family went to the beach. We left early in the morning. The drive took two hours.` },
        { label: 'B', text: `When we arrived, I could see the blue ocean. The sand was warm and soft. I took off my shoes and ran to the water.` },
        { label: 'C', text: `My dad helped me build a sandcastle. We used a bucket and a small shovel. The sandcastle was very big.` },
        { label: 'D', text: `My mom sat under an umbrella. She read a book and watched us play. She put sunscreen on my face so I wouldn't get sunburned.` },
        { label: 'E', text: `For lunch, we ate sandwiches and fruit. I drank cold juice. The food tasted extra good at the beach.` },
        { label: 'F', text: `We stayed until the sun started to go down. I was tired but happy. It was the best day of summer!` },
      ],
    },
  ],
  A2: [
    {
      title: 'Learning to Cook',
      topic: 'food',
      difficulty: 2,
      content: `When I was young, I didn't know how to cook anything. I always ate food that my mother prepared for me. But last year, I decided to learn cooking.

First, I watched cooking videos on the internet. The videos showed me how to make simple dishes like pasta and soup. I wrote down the recipes in a notebook.

My first attempt was making scrambled eggs. It was not perfect, but it was edible. My family encouraged me to keep trying.

Week by week, I improved my skills. I learned how to use different spices and seasonings. I discovered that cooking is actually creative and fun.

Now I can cook several dishes. My specialty is chicken stir-fry. Everyone in my family enjoys the food I make.

I plan to learn more advanced recipes soon. Maybe I will even take a cooking class one day.`,
      paragraphs: [
        { label: 'A', text: `When I was young, I didn't know how to cook anything. I always ate food that my mother prepared for me. But last year, I decided to learn cooking.` },
        { label: 'B', text: `First, I watched cooking videos on the internet. The videos showed me how to make simple dishes like pasta and soup. I wrote down the recipes in a notebook.` },
        { label: 'C', text: `My first attempt was making scrambled eggs. It was not perfect, but it was edible. My family encouraged me to keep trying.` },
        { label: 'D', text: `Week by week, I improved my skills. I learned how to use different spices and seasonings. I discovered that cooking is actually creative and fun.` },
        { label: 'E', text: `Now I can cook several dishes. My specialty is chicken stir-fry. Everyone in my family enjoys the food I make.` },
        { label: 'F', text: `I plan to learn more advanced recipes soon. Maybe I will even take a cooking class one day.` },
      ],
    },
    {
      title: 'The New Neighbor',
      topic: 'community',
      difficulty: 2,
      content: `A new family moved into the house next door last month. They came from another city and didn't know anyone in our neighborhood.

The family has two children around my age. Their names are Tom and Sarah. Tom likes sports, and Sarah enjoys painting.

At first, they seemed shy and stayed inside their house. I wanted to be friendly, so I invited them to play basketball with me and my friends.

They came to the basketball court the next day. Tom was very good at basketball! Sarah preferred to sit and draw pictures of us playing.

Now we are good friends. We often study together and help each other with homework. On weekends, we ride bicycles in the park.

Our families also became friends. We have dinner together sometimes. My mom and their mom share cooking recipes.`,
      paragraphs: [
        { label: 'A', text: `A new family moved into the house next door last month. They came from another city and didn't know anyone in our neighborhood.` },
        { label: 'B', text: `The family has two children around my age. Their names are Tom and Sarah. Tom likes sports, and Sarah enjoys painting.` },
        { label: 'C', text: `At first, they seemed shy and stayed inside their house. I wanted to be friendly, so I invited them to play basketball with me and my friends.` },
        { label: 'D', text: `They came to the basketball court the next day. Tom was very good at basketball! Sarah preferred to sit and draw pictures of us playing.` },
        { label: 'E', text: `Now we are good friends. We often study together and help each other with homework. On weekends, we ride bicycles in the park.` },
        { label: 'F', text: `Our families also became friends. We have dinner together sometimes. My mom and their mom share cooking recipes.` },
      ],
    },
    {
      title: 'A Rainy Day Adventure',
      topic: 'weather',
      difficulty: 2,
      content: `It was raining heavily on Saturday morning. I was disappointed because I had planned to go to the park with my friends.

Instead, I stayed home and looked out the window. The raindrops made interesting patterns on the glass. I saw a rainbow forming in the sky.

My little sister was bored too. I had an idea—we could build a fort with blankets and pillows. She was excited about this plan.

We collected all the pillows from the house. We used chairs and the sofa to create a tent shape. Then we covered everything with blankets.

Inside our fort, we played games and told stories. My sister made up a story about a magical kingdom. We also had hot chocolate that mom made for us.

When the rain stopped, I realized something. Sometimes the best adventures happen when your original plans don't work out.`,
      paragraphs: [
        { label: 'A', text: `It was raining heavily on Saturday morning. I was disappointed because I had planned to go to the park with my friends.` },
        { label: 'B', text: `Instead, I stayed home and looked out the window. The raindrops made interesting patterns on the glass. I saw a rainbow forming in the sky.` },
        { label: 'C', text: `My little sister was bored too. I had an idea—we could build a fort with blankets and pillows. She was excited about this plan.` },
        { label: 'D', text: `We collected all the pillows from the house. We used chairs and the sofa to create a tent shape. Then we covered everything with blankets.` },
        { label: 'E', text: `Inside our fort, we played games and told stories. My sister made up a story about a magical kingdom. We also had hot chocolate that mom made for us.` },
        { label: 'F', text: `When the rain stopped, I realized something. Sometimes the best adventures happen when your original plans don't work out.` },
      ],
    },
  ],
  B1: [
    {
      title: 'The Benefits of Remote Work',
      topic: 'business',
      difficulty: 3,
      content: `Remote work has become increasingly popular in recent years. Many companies now allow their employees to work from home for at least part of the week.

One major advantage is the flexibility it offers. Workers can often set their own schedules and avoid long commutes. This can lead to better work-life balance and reduced stress.

However, remote work also presents challenges. Some people find it difficult to stay motivated without colleagues around. The line between work and personal life can become blurred when your office is your living room.

Communication can be another issue. While video calls and instant messaging help, they don't fully replace face-to-face interactions. Some team members may feel isolated or disconnected from company culture.

Companies are finding creative solutions to these problems. Virtual team-building activities and regular video meetings help maintain team spirit. Some organizations use hybrid models, combining remote and office work.

The future of work is likely to be more flexible than ever before. Both employers and employees are learning to adapt to this new way of working.`,
      paragraphs: [
        { label: 'A', text: `Remote work has become increasingly popular in recent years. Many companies now allow their employees to work from home for at least part of the week.` },
        { label: 'B', text: `One major advantage is the flexibility it offers. Workers can often set their own schedules and avoid long commutes. This can lead to better work-life balance and reduced stress.` },
        { label: 'C', text: `However, remote work also presents challenges. Some people find it difficult to stay motivated without colleagues around. The line between work and personal life can become blurred when your office is your living room.` },
        { label: 'D', text: `Communication can be another issue. While video calls and instant messaging help, they don't fully replace face-to-face interactions. Some team members may feel isolated or disconnected from company culture.` },
        { label: 'E', text: `Companies are finding creative solutions to these problems. Virtual team-building activities and regular video meetings help maintain team spirit. Some organizations use hybrid models, combining remote and office work.` },
        { label: 'F', text: `The future of work is likely to be more flexible than ever before. Both employers and employees are learning to adapt to this new way of working.` },
      ],
    },
    {
      title: 'Social Media and Mental Health',
      topic: 'health',
      difficulty: 3,
      content: `Social media has transformed how we communicate and share information. Platforms like Instagram, Twitter, and TikTok have billions of users worldwide. But researchers are increasingly concerned about their effects on mental health.

Studies have found links between heavy social media use and increased rates of anxiety and depression. Young people seem particularly vulnerable. The constant comparison with others' carefully curated lives can damage self-esteem.

The addictive nature of these platforms is also concerning. They are designed to keep users scrolling, often using techniques that trigger dopamine releases in the brain. Many people find it hard to put their phones down.

On the positive side, social media can provide valuable social connections. For people who feel isolated, online communities offer support and friendship. During the pandemic, these platforms helped many people maintain relationships.

Mental health experts recommend setting boundaries with social media. Taking regular breaks, limiting screen time, and curating feeds to remove negative content can help. Being mindful about how these platforms make you feel is important.

The key is finding a balance that works for you. Social media isn't inherently bad, but like many things in life, moderation is essential for wellbeing.`,
      paragraphs: [
        { label: 'A', text: `Social media has transformed how we communicate and share information. Platforms like Instagram, Twitter, and TikTok have billions of users worldwide. But researchers are increasingly concerned about their effects on mental health.` },
        { label: 'B', text: `Studies have found links between heavy social media use and increased rates of anxiety and depression. Young people seem particularly vulnerable. The constant comparison with others' carefully curated lives can damage self-esteem.` },
        { label: 'C', text: `The addictive nature of these platforms is also concerning. They are designed to keep users scrolling, often using techniques that trigger dopamine releases in the brain. Many people find it hard to put their phones down.` },
        { label: 'D', text: `On the positive side, social media can provide valuable social connections. For people who feel isolated, online communities offer support and friendship. During the pandemic, these platforms helped many people maintain relationships.` },
        { label: 'E', text: `Mental health experts recommend setting boundaries with social media. Taking regular breaks, limiting screen time, and curating feeds to remove negative content can help. Being mindful about how these platforms make you feel is important.` },
        { label: 'F', text: `The key is finding a balance that works for you. Social media isn't inherently bad, but like many things in life, moderation is essential for wellbeing.` },
      ],
    },
    {
      title: 'Electric Vehicles: The Road Ahead',
      topic: 'technology',
      difficulty: 3,
      content: `Electric vehicles are rapidly gaining popularity around the world. Sales have grown dramatically as more consumers become aware of environmental issues and governments offer incentives.

The technology behind EVs has improved significantly. Modern electric cars can travel over 300 miles on a single charge. Charging times have decreased, and the number of charging stations is increasing.

Cost remains a significant barrier for many potential buyers. Electric vehicles typically have higher upfront prices than comparable gasoline cars. However, lower fuel and maintenance costs can offset this difference over time.

Environmental benefits are a major selling point. EVs produce no direct emissions, which can improve air quality in cities. Of course, the overall environmental impact depends on how the electricity is generated.

Major automakers are investing billions in electric vehicle development. Many have announced plans to phase out internal combustion engines entirely within the next few decades. This shift is creating new jobs in manufacturing and technology.

The transition to electric vehicles will take time. Infrastructure needs to expand, and consumer attitudes must continue to evolve. But the direction of travel seems clear.`,
      paragraphs: [
        { label: 'A', text: `Electric vehicles are rapidly gaining popularity around the world. Sales have grown dramatically as more consumers become aware of environmental issues and governments offer incentives.` },
        { label: 'B', text: `The technology behind EVs has improved significantly. Modern electric cars can travel over 300 miles on a single charge. Charging times have decreased, and the number of charging stations is increasing.` },
        { label: 'C', text: `Cost remains a significant barrier for many potential buyers. Electric vehicles typically have higher upfront prices than comparable gasoline cars. However, lower fuel and maintenance costs can offset this difference over time.` },
        { label: 'D', text: `Environmental benefits are a major selling point. EVs produce no direct emissions, which can improve air quality in cities. Of course, the overall environmental impact depends on how the electricity is generated.` },
        { label: 'E', text: `Major automakers are investing billions in electric vehicle development. Many have announced plans to phase out internal combustion engines entirely within the next few decades. This shift is creating new jobs in manufacturing and technology.` },
        { label: 'F', text: `The transition to electric vehicles will take time. Infrastructure needs to expand, and consumer attitudes must continue to evolve. But the direction of travel seems clear.` },
      ],
    },
  ],
  B2: [
    {
      title: 'Artificial Intelligence in Healthcare',
      topic: 'science',
      difficulty: 4,
      content: `Artificial intelligence is revolutionizing the healthcare industry in ways that would have seemed impossible just a decade ago. From diagnostic imaging to drug discovery, AI applications are becoming increasingly sophisticated.

In radiology, machine learning algorithms can now detect certain conditions with accuracy rivaling or even exceeding that of experienced physicians. These systems can analyze thousands of images in the time it takes a human to examine one, potentially catching abnormalities that might otherwise be missed.

Drug development is another area being transformed by AI. The traditional process of developing a new medication can take over a decade and cost billions of dollars. AI can accelerate this by predicting how different compounds might interact with biological systems.

However, the integration of AI in healthcare raises important ethical questions. Issues of data privacy, algorithmic bias, and the appropriate role of automation in life-and-death decisions require careful consideration.

There's also the question of how AI will affect healthcare workers. While some fear job displacement, others argue that AI will augment rather than replace human capabilities, allowing practitioners to focus on tasks requiring empathy and complex decision-making.

The most successful implementations of healthcare AI seem to be those that combine the computational power of machines with human oversight and judgment.`,
      paragraphs: [
        { label: 'A', text: `Artificial intelligence is revolutionizing the healthcare industry in ways that would have seemed impossible just a decade ago. From diagnostic imaging to drug discovery, AI applications are becoming increasingly sophisticated.` },
        { label: 'B', text: `In radiology, machine learning algorithms can now detect certain conditions with accuracy rivaling or even exceeding that of experienced physicians. These systems can analyze thousands of images in the time it takes a human to examine one, potentially catching abnormalities that might otherwise be missed.` },
        { label: 'C', text: `Drug development is another area being transformed by AI. The traditional process of developing a new medication can take over a decade and cost billions of dollars. AI can accelerate this by predicting how different compounds might interact with biological systems.` },
        { label: 'D', text: `However, the integration of AI in healthcare raises important ethical questions. Issues of data privacy, algorithmic bias, and the appropriate role of automation in life-and-death decisions require careful consideration.` },
        { label: 'E', text: `There's also the question of how AI will affect healthcare workers. While some fear job displacement, others argue that AI will augment rather than replace human capabilities, allowing practitioners to focus on tasks requiring empathy and complex decision-making.` },
        { label: 'F', text: `The most successful implementations of healthcare AI seem to be those that combine the computational power of machines with human oversight and judgment.` },
      ],
    },
    {
      title: 'The Psychology of Decision Making',
      topic: 'psychology',
      difficulty: 4,
      content: `Human decision-making is far less rational than we often believe. Decades of psychological research have revealed the cognitive biases and mental shortcuts that influence our choices, often without our awareness.

One of the most well-documented phenomena is confirmation bias—our tendency to seek out and remember information that confirms our existing beliefs while ignoring contradictory evidence. This can lead to increasingly polarized viewpoints over time.

The framing effect demonstrates how the same information can lead to different decisions depending on how it's presented. Studies show that people respond differently to "90% success rate" versus "10% failure rate," even though these are mathematically identical.

Emotional states also profoundly influence decisions. Research shows that people in positive moods tend to make more optimistic assessments, while anxiety can lead to risk-averse choices. The timing of decisions matters too—we make better choices when our mental resources aren't depleted.

Understanding these biases has practical applications in fields ranging from marketing to public policy. "Nudge" theory, for example, uses insights from behavioral economics to design environments that encourage better choices without restricting freedom.

Awareness of our cognitive limitations is the first step toward better decision-making. Techniques like considering the opposite, seeking diverse perspectives, and taking time before important decisions can help counteract our natural biases.`,
      paragraphs: [
        { label: 'A', text: `Human decision-making is far less rational than we often believe. Decades of psychological research have revealed the cognitive biases and mental shortcuts that influence our choices, often without our awareness.` },
        { label: 'B', text: `One of the most well-documented phenomena is confirmation bias—our tendency to seek out and remember information that confirms our existing beliefs while ignoring contradictory evidence. This can lead to increasingly polarized viewpoints over time.` },
        { label: 'C', text: `The framing effect demonstrates how the same information can lead to different decisions depending on how it's presented. Studies show that people respond differently to "90% success rate" versus "10% failure rate," even though these are mathematically identical.` },
        { label: 'D', text: `Emotional states also profoundly influence decisions. Research shows that people in positive moods tend to make more optimistic assessments, while anxiety can lead to risk-averse choices. The timing of decisions matters too—we make better choices when our mental resources aren't depleted.` },
        { label: 'E', text: `Understanding these biases has practical applications in fields ranging from marketing to public policy. "Nudge" theory, for example, uses insights from behavioral economics to design environments that encourage better choices without restricting freedom.` },
        { label: 'F', text: `Awareness of our cognitive limitations is the first step toward better decision-making. Techniques like considering the opposite, seeking diverse perspectives, and taking time before important decisions can help counteract our natural biases.` },
      ],
    },
    {
      title: 'Urbanization and Sustainable Cities',
      topic: 'environment',
      difficulty: 4,
      content: `More than half of the world's population now lives in cities, and this proportion is expected to rise to 68% by 2050. This unprecedented urbanization presents both challenges and opportunities for sustainable development.

Cities are responsible for about 70% of global carbon emissions, primarily through energy use in buildings and transportation. Yet they also offer efficiency advantages: dense urban areas can support public transit, reduce per-capita land use, and enable district heating and cooling systems.

The concept of the "smart city" has gained traction as a response to urban challenges. By integrating sensors, data analytics, and connected devices, cities can optimize everything from traffic flow to energy consumption. Singapore and Seoul have become showcases for this approach.

However, technology alone cannot solve urban sustainability problems. Social equity must be central to urban planning. Without careful attention, "smart" innovations can exacerbate existing inequalities, creating digital divides and displacing vulnerable populations.

Green infrastructure—including parks, urban forests, and green roofs—is increasingly recognized as essential for sustainable cities. These features provide multiple benefits: absorbing carbon, reducing heat island effects, managing stormwater, and improving mental health.

The cities that thrive in the coming decades will likely be those that balance technological innovation with inclusive governance and ecological restoration.`,
      paragraphs: [
        { label: 'A', text: `More than half of the world's population now lives in cities, and this proportion is expected to rise to 68% by 2050. This unprecedented urbanization presents both challenges and opportunities for sustainable development.` },
        { label: 'B', text: `Cities are responsible for about 70% of global carbon emissions, primarily through energy use in buildings and transportation. Yet they also offer efficiency advantages: dense urban areas can support public transit, reduce per-capita land use, and enable district heating and cooling systems.` },
        { label: 'C', text: `The concept of the "smart city" has gained traction as a response to urban challenges. By integrating sensors, data analytics, and connected devices, cities can optimize everything from traffic flow to energy consumption. Singapore and Seoul have become showcases for this approach.` },
        { label: 'D', text: `However, technology alone cannot solve urban sustainability problems. Social equity must be central to urban planning. Without careful attention, "smart" innovations can exacerbate existing inequalities, creating digital divides and displacing vulnerable populations.` },
        { label: 'E', text: `Green infrastructure—including parks, urban forests, and green roofs—is increasingly recognized as essential for sustainable cities. These features provide multiple benefits: absorbing carbon, reducing heat island effects, managing stormwater, and improving mental health.` },
        { label: 'F', text: `The cities that thrive in the coming decades will likely be those that balance technological innovation with inclusive governance and ecological restoration.` },
      ],
    },
  ],
  C1: [
    {
      title: 'The Neuroscience of Creativity',
      topic: 'science',
      difficulty: 5,
      content: `The neural basis of creativity has long puzzled scientists, but advanced neuroimaging techniques are beginning to illuminate this complex phenomenon. Contrary to popular belief, creativity does not reside in a single brain region or hemisphere.

Research using functional MRI has revealed that creative thinking involves the coordinated activity of multiple brain networks. The default mode network, typically associated with daydreaming and self-referential thought, plays a crucial role in generating novel ideas.

However, the executive control network is equally important, helping to evaluate and refine creative outputs. The most creative individuals appear to be those who can effectively balance spontaneous ideation with focused critical analysis.

Interestingly, creativity seems to require a certain degree of cognitive disinhibition—a willingness to consider ideas that might initially seem irrelevant or bizarre. This explains why conditions such as mild sleep deprivation or intoxication can sometimes facilitate creative insights.

The relationship between expertise and creativity is nuanced. Deep knowledge of a domain provides the building blocks for innovation, yet excessive reliance on established patterns can impede novel thinking. The phenomenon of "thinking outside the box" may actually involve temporarily suppressing well-learned associations.

These findings have implications for education and organizational management. Environments that allow for both focused work and unconstrained exploration, that tolerate ambiguity and occasional failure, may be most conducive to creative breakthroughs.`,
      paragraphs: [
        { label: 'A', text: `The neural basis of creativity has long puzzled scientists, but advanced neuroimaging techniques are beginning to illuminate this complex phenomenon. Contrary to popular belief, creativity does not reside in a single brain region or hemisphere.` },
        { label: 'B', text: `Research using functional MRI has revealed that creative thinking involves the coordinated activity of multiple brain networks. The default mode network, typically associated with daydreaming and self-referential thought, plays a crucial role in generating novel ideas.` },
        { label: 'C', text: `However, the executive control network is equally important, helping to evaluate and refine creative outputs. The most creative individuals appear to be those who can effectively balance spontaneous ideation with focused critical analysis.` },
        { label: 'D', text: `Interestingly, creativity seems to require a certain degree of cognitive disinhibition—a willingness to consider ideas that might initially seem irrelevant or bizarre. This explains why conditions such as mild sleep deprivation or intoxication can sometimes facilitate creative insights.` },
        { label: 'E', text: `The relationship between expertise and creativity is nuanced. Deep knowledge of a domain provides the building blocks for innovation, yet excessive reliance on established patterns can impede novel thinking. The phenomenon of "thinking outside the box" may actually involve temporarily suppressing well-learned associations.` },
        { label: 'F', text: `These findings have implications for education and organizational management. Environments that allow for both focused work and unconstrained exploration, that tolerate ambiguity and occasional failure, may be most conducive to creative breakthroughs.` },
      ],
    },
    {
      title: 'The Economics of Climate Change',
      topic: 'economics',
      difficulty: 5,
      content: `Climate change presents economics with one of its greatest challenges: accounting for costs and benefits that span generations and involve profound uncertainty. Traditional cost-benefit analysis struggles with these temporal and epistemic complexities.

The choice of discount rate—how we value future costs relative to present ones—has enormous implications for climate policy. A high discount rate effectively prioritizes current consumption; a low rate gives greater weight to the welfare of future generations. Economists continue to debate which approach is ethically defensible.

The concept of externalities is central to understanding climate economics. Greenhouse gas emissions represent a classic market failure: those who produce them do not bear their full costs. Carbon pricing mechanisms, whether through taxes or cap-and-trade systems, attempt to internalize these external costs.

Transition risks add another dimension to economic analysis. The shift away from fossil fuels will create winners and losers, potentially stranding trillions of dollars in assets. Financial regulators are increasingly concerned about systemic risks to the economy from both physical climate impacts and the transition itself.

The distributional effects of climate change are profoundly unequal. Those who have contributed least to the problem—particularly in developing nations—often face the most severe consequences. Climate justice demands that policy responses address these inequities.

Economic models increasingly suggest that aggressive emissions reduction is cost-effective when the full range of climate risks is considered. The real question may be not whether to act, but how quickly and equitably to proceed.`,
      paragraphs: [
        { label: 'A', text: `Climate change presents economics with one of its greatest challenges: accounting for costs and benefits that span generations and involve profound uncertainty. Traditional cost-benefit analysis struggles with these temporal and epistemic complexities.` },
        { label: 'B', text: `The choice of discount rate—how we value future costs relative to present ones—has enormous implications for climate policy. A high discount rate effectively prioritizes current consumption; a low rate gives greater weight to the welfare of future generations. Economists continue to debate which approach is ethically defensible.` },
        { label: 'C', text: `The concept of externalities is central to understanding climate economics. Greenhouse gas emissions represent a classic market failure: those who produce them do not bear their full costs. Carbon pricing mechanisms, whether through taxes or cap-and-trade systems, attempt to internalize these external costs.` },
        { label: 'D', text: `Transition risks add another dimension to economic analysis. The shift away from fossil fuels will create winners and losers, potentially stranding trillions of dollars in assets. Financial regulators are increasingly concerned about systemic risks to the economy from both physical climate impacts and the transition itself.` },
        { label: 'E', text: `The distributional effects of climate change are profoundly unequal. Those who have contributed least to the problem—particularly in developing nations—often face the most severe consequences. Climate justice demands that policy responses address these inequities.` },
        { label: 'F', text: `Economic models increasingly suggest that aggressive emissions reduction is cost-effective when the full range of climate risks is considered. The real question may be not whether to act, but how quickly and equitably to proceed.` },
      ],
    },
    {
      title: 'Language, Thought, and Reality',
      topic: 'philosophy',
      difficulty: 5,
      content: `The relationship between language and thought has fascinated philosophers and linguists for centuries. Does the language we speak shape how we perceive reality, or is thought fundamentally independent of its linguistic expression?

The strong version of linguistic relativity, often attributed to Benjamin Lee Whorf, suggests that language determines thought. If a language lacks a word for a concept, speakers supposedly cannot think about it. This extreme position has largely been abandoned, but weaker versions continue to generate research.

Contemporary studies have found evidence for more subtle linguistic effects. Speakers of languages with grammatical gender often perceive objects as having gendered qualities. Those whose languages use absolute spatial terms (like cardinal directions) rather than relative ones (left, right) may develop enhanced navigational abilities.

Color perception offers a particularly interesting case study. Languages differ in how they carve up the color spectrum, and these differences appear to affect perceptual discrimination at the boundaries of color categories. Yet the basic perception of color wavelengths remains universal.

The relationship is almost certainly bidirectional. Language shapes thought, but thought also shapes language. New concepts require new vocabulary, and the communicative needs of a culture influence linguistic evolution.

Perhaps most importantly, humans are not prisoners of their native languages. We can learn new languages, create new words, and expand our conceptual repertoires. Language is a tool for thought, but a remarkably flexible one.`,
      paragraphs: [
        { label: 'A', text: `The relationship between language and thought has fascinated philosophers and linguists for centuries. Does the language we speak shape how we perceive reality, or is thought fundamentally independent of its linguistic expression?` },
        { label: 'B', text: `The strong version of linguistic relativity, often attributed to Benjamin Lee Whorf, suggests that language determines thought. If a language lacks a word for a concept, speakers supposedly cannot think about it. This extreme position has largely been abandoned, but weaker versions continue to generate research.` },
        { label: 'C', text: `Contemporary studies have found evidence for more subtle linguistic effects. Speakers of languages with grammatical gender often perceive objects as having gendered qualities. Those whose languages use absolute spatial terms (like cardinal directions) rather than relative ones (left, right) may develop enhanced navigational abilities.` },
        { label: 'D', text: `Color perception offers a particularly interesting case study. Languages differ in how they carve up the color spectrum, and these differences appear to affect perceptual discrimination at the boundaries of color categories. Yet the basic perception of color wavelengths remains universal.` },
        { label: 'E', text: `The relationship is almost certainly bidirectional. Language shapes thought, but thought also shapes language. New concepts require new vocabulary, and the communicative needs of a culture influence linguistic evolution.` },
        { label: 'F', text: `Perhaps most importantly, humans are not prisoners of their native languages. We can learn new languages, create new words, and expand our conceptual repertoires. Language is a tool for thought, but a remarkably flexible one.` },
      ],
    },
  ],
  C2: [
    {
      title: 'Consciousness and the Hard Problem',
      topic: 'philosophy',
      difficulty: 6,
      content: `The nature of consciousness remains one of the most vexing problems in philosophy and science. While we have made tremendous progress in understanding the neural correlates of conscious experience, explaining why subjective experience exists at all—what philosopher David Chalmers calls "the hard problem"—seems to require something beyond physical explanation.

The easy problems of consciousness, in contrast, involve explaining cognitive functions: how we integrate information, report on mental states, or focus attention. These are difficult scientific questions, but they seem tractable through neuroscientific methods. The hard problem asks why these processes are accompanied by subjective experience.

Several philosophical positions attempt to address this challenge. Physicalists maintain that consciousness will eventually be explained in purely physical terms, perhaps through advances in neuroscience we cannot yet anticipate. Mysterians suggest that the problem may exceed human cognitive capacities, just as calculus exceeds the capabilities of chimpanzees.

Panpsychism, experiencing a philosophical renaissance, proposes that consciousness is a fundamental feature of reality, present to some degree in all matter. This sidesteps the emergence problem but raises questions about how micro-experiences combine into unified conscious minds.

Integrated Information Theory offers a mathematical framework for quantifying consciousness based on the integration of information within a system. While promising, it leads to counterintuitive conclusions, such as attributing some level of consciousness to simple logic gates.

What is perhaps most remarkable is that consciousness exists at all—that there is something it is like to be a human being, reading these words, at this moment in time.`,
      paragraphs: [
        { label: 'A', text: `The nature of consciousness remains one of the most vexing problems in philosophy and science. While we have made tremendous progress in understanding the neural correlates of conscious experience, explaining why subjective experience exists at all—what philosopher David Chalmers calls "the hard problem"—seems to require something beyond physical explanation.` },
        { label: 'B', text: `The easy problems of consciousness, in contrast, involve explaining cognitive functions: how we integrate information, report on mental states, or focus attention. These are difficult scientific questions, but they seem tractable through neuroscientific methods. The hard problem asks why these processes are accompanied by subjective experience.` },
        { label: 'C', text: `Several philosophical positions attempt to address this challenge. Physicalists maintain that consciousness will eventually be explained in purely physical terms, perhaps through advances in neuroscience we cannot yet anticipate. Mysterians suggest that the problem may exceed human cognitive capacities, just as calculus exceeds the capabilities of chimpanzees.` },
        { label: 'D', text: `Panpsychism, experiencing a philosophical renaissance, proposes that consciousness is a fundamental feature of reality, present to some degree in all matter. This sidesteps the emergence problem but raises questions about how micro-experiences combine into unified conscious minds.` },
        { label: 'E', text: `Integrated Information Theory offers a mathematical framework for quantifying consciousness based on the integration of information within a system. While promising, it leads to counterintuitive conclusions, such as attributing some level of consciousness to simple logic gates.` },
        { label: 'F', text: `What is perhaps most remarkable is that consciousness exists at all—that there is something it is like to be a human being, reading these words, at this moment in time.` },
      ],
    },
    {
      title: 'The Epistemology of Testimony',
      topic: 'philosophy',
      difficulty: 6,
      content: `How much of what we believe do we actually know firsthand? The epistemology of testimony examines how we acquire knowledge from the assertions of others—a source that constitutes the vast majority of what any individual claims to know.

Reductionist accounts hold that testimonial knowledge must ultimately be grounded in non-testimonial evidence. We trust a speaker's testimony because we have independent reasons to believe them reliable—observations of their past accuracy, coherence with other known facts, or inference from their presumed expertise.

Anti-reductionist views, by contrast, suggest that testimony constitutes a basic source of knowledge, akin to perception or memory. Just as we are entitled to trust our senses unless we have specific reasons for doubt, we may be entitled to accept testimony at face value. This seems to capture how we actually form beliefs.

The question becomes more complex in the digital age. Social media, search algorithms, and artificial intelligence mediate much of the testimony we encounter. How should we evaluate claims when we cannot verify the speaker's identity, when content is algorithmically curated, or when text is generated by machines trained on human-produced data?

Trust in expertise has become particularly fraught. While epistemic deference to specialists seems rationally required given the division of cognitive labor, determining who counts as an expert—and what to do when experts disagree—presents genuine challenges.

Perhaps the most important insight is that knowledge is fundamentally social. Epistemic autonomy, pushed too far, becomes epistemic isolation. We are all dependent on the testimony of others, making the institutions that shape testimonial exchange vital to collective rationality.`,
      paragraphs: [
        { label: 'A', text: `How much of what we believe do we actually know firsthand? The epistemology of testimony examines how we acquire knowledge from the assertions of others—a source that constitutes the vast majority of what any individual claims to know.` },
        { label: 'B', text: `Reductionist accounts hold that testimonial knowledge must ultimately be grounded in non-testimonial evidence. We trust a speaker's testimony because we have independent reasons to believe them reliable—observations of their past accuracy, coherence with other known facts, or inference from their presumed expertise.` },
        { label: 'C', text: `Anti-reductionist views, by contrast, suggest that testimony constitutes a basic source of knowledge, akin to perception or memory. Just as we are entitled to trust our senses unless we have specific reasons for doubt, we may be entitled to accept testimony at face value. This seems to capture how we actually form beliefs.` },
        { label: 'D', text: `The question becomes more complex in the digital age. Social media, search algorithms, and artificial intelligence mediate much of the testimony we encounter. How should we evaluate claims when we cannot verify the speaker's identity, when content is algorithmically curated, or when text is generated by machines trained on human-produced data?` },
        { label: 'E', text: `Trust in expertise has become particularly fraught. While epistemic deference to specialists seems rationally required given the division of cognitive labor, determining who counts as an expert—and what to do when experts disagree—presents genuine challenges.` },
        { label: 'F', text: `Perhaps the most important insight is that knowledge is fundamentally social. Epistemic autonomy, pushed too far, becomes epistemic isolation. We are all dependent on the testimony of others, making the institutions that shape testimonial exchange vital to collective rationality.` },
      ],
    },
    {
      title: 'Emergence and Reductionism in Complex Systems',
      topic: 'science',
      difficulty: 6,
      content: `The tension between emergence and reductionism lies at the heart of debates about how to understand complex systems. Can higher-level phenomena be fully explained by their lower-level constituents, or do new properties genuinely emerge that cannot be predicted from components alone?

Strong emergence claims that some phenomena are ontologically irreducible: they represent genuinely novel additions to the furniture of reality that could not, even in principle, be derived from complete knowledge of underlying physics. Consciousness is often cited as a candidate for such emergence.

Weak emergence, more widely accepted among scientists, suggests that emergent properties are epistemically but not ontologically irreducible. They are surprising and difficult to predict, but still ultimately caused by and supervene upon lower-level processes. Weather patterns exemplify this type: incredibly hard to predict but still governed by physics.

The study of complex adaptive systems has revealed how simple rules can generate astonishingly complex behaviors. Flocking birds, market dynamics, and neural networks all exhibit emergent patterns that arise from local interactions among components following relatively simple rules.

Downward causation presents particular conceptual challenges. When we say that beliefs cause behavior, or that market sentiment affects individual trading decisions, are we describing genuine causal relationships or convenient shorthand for underlying physical processes?

The resolution may require rethinking our notion of explanation itself. Different levels of description may be appropriate for different purposes, without any level being privileged as the "true" one.`,
      paragraphs: [
        { label: 'A', text: `The tension between emergence and reductionism lies at the heart of debates about how to understand complex systems. Can higher-level phenomena be fully explained by their lower-level constituents, or do new properties genuinely emerge that cannot be predicted from components alone?` },
        { label: 'B', text: `Strong emergence claims that some phenomena are ontologically irreducible: they represent genuinely novel additions to the furniture of reality that could not, even in principle, be derived from complete knowledge of underlying physics. Consciousness is often cited as a candidate for such emergence.` },
        { label: 'C', text: `Weak emergence, more widely accepted among scientists, suggests that emergent properties are epistemically but not ontologically irreducible. They are surprising and difficult to predict, but still ultimately caused by and supervene upon lower-level processes. Weather patterns exemplify this type: incredibly hard to predict but still governed by physics.` },
        { label: 'D', text: `The study of complex adaptive systems has revealed how simple rules can generate astonishingly complex behaviors. Flocking birds, market dynamics, and neural networks all exhibit emergent patterns that arise from local interactions among components following relatively simple rules.` },
        { label: 'E', text: `Downward causation presents particular conceptual challenges. When we say that beliefs cause behavior, or that market sentiment affects individual trading decisions, are we describing genuine causal relationships or convenient shorthand for underlying physical processes?` },
        { label: 'F', text: `The resolution may require rethinking our notion of explanation itself. Different levels of description may be appropriate for different purposes, without any level being privileged as the "true" one.` },
      ],
    },
  ],
};

// Question templates for different types
const generateQuestionsByType = (
  type: QuestionType,
  passage: typeof passages.A1[0],
  startId: number,
  count: number
): Part['questions'] => {
  const questions: Part['questions'] = [];

  for (let i = 0; i < count; i++) {
    const qId = startId + i;
    const paragraphLabels = passage.paragraphs.map(p => p.label);

    switch (type) {
      case 'multiple-choice':
        questions.push({
          id: qId,
          type,
          question: getMultipleChoiceQuestion(passage, i),
          options: getMultipleChoiceOptions(passage, i),
          correctAnswer: getMultipleChoiceAnswer(i),
        });
        break;

      case 'matching-headings':
        questions.push({
          id: qId,
          type,
          question: `Match the heading to paragraph ${paragraphLabels[i % paragraphLabels.length]}`,
          options: getHeadingOptions(passage),
          correctAnswer: getHeadingAnswer(passage, i),
        });
        break;

      case 'matching-paragraph':
        questions.push({
          id: qId,
          type,
          question: `Which paragraph contains information about ${getInfoTopic(passage, i)}?`,
          options: paragraphLabels,
          correctAnswer: paragraphLabels[i % paragraphLabels.length],
        });
        break;

      case 'matching-features':
        questions.push({
          id: qId,
          type,
          question: `Match the feature "${getFeature(passage, i)}" with the correct description`,
          options: getFeatureOptions(passage),
          correctAnswer: getFeatureAnswer(i),
        });
        break;

      case 'matching-endings':
        questions.push({
          id: qId,
          type,
          question: `Complete the sentence: "${getSentenceStart(passage, i)}"`,
          options: getEndingOptions(passage, i),
          correctAnswer: getEndingAnswer(i),
        });
        break;

      case 'list-selection':
        questions.push({
          id: qId,
          type,
          question: getListQuestion(passage, i),
          options: getListOptions(passage, i),
          correctAnswer: getListAnswer(i),
        });
        break;

      case 'choose-title':
        questions.push({
          id: qId,
          type,
          question: 'Which title best summarizes the main idea of this passage?',
          options: getTitleOptions(passage),
          correctAnswer: passage.title,
        });
        break;
    }
  }

  return questions;
};

// Helper functions for generating questions
const getMultipleChoiceQuestion = (passage: typeof passages.A1[0], index: number): string => {
  const questions = [
    `According to the passage, what is the main purpose of the text?`,
    `What does the author suggest about ${passage.topic}?`,
    `Which statement best reflects the author's view?`,
    `What can be inferred from the passage?`,
    `The passage primarily discusses which aspect?`,
    `What conclusion can be drawn from the information provided?`,
    `Which detail from the passage supports the main argument?`,
    `What is the relationship between the ideas in paragraphs A and B?`,
    `How does the author develop the main argument?`,
    `What is implied about the future of ${passage.topic}?`,
  ];
  return questions[index % questions.length];
};

const getMultipleChoiceOptions = (passage: typeof passages.A1[0], index: number): string[] => {
  const optionSets = [
    [
      'To provide a comprehensive overview of the topic',
      'To argue against common misconceptions',
      'To describe a historical development',
      'To propose a new theoretical framework',
    ],
    [
      'It has both positive and negative aspects',
      'It is entirely beneficial to society',
      'It should be approached with caution',
      'It requires further research',
    ],
    [
      'Change is inevitable and often positive',
      'Traditional methods are always superior',
      'Innovation comes with significant risks',
      'Progress requires careful planning',
    ],
    [
      'The topic is more complex than commonly believed',
      'Simple solutions exist for complex problems',
      'Historical patterns always repeat',
      'The future is entirely predictable',
    ],
  ];
  return optionSets[index % optionSets.length];
};

const getMultipleChoiceAnswer = (index: number): string => {
  const answers = [
    'To provide a comprehensive overview of the topic',
    'It has both positive and negative aspects',
    'Change is inevitable and often positive',
    'The topic is more complex than commonly believed',
  ];
  return answers[index % answers.length];
};

const getHeadingOptions = (passage: typeof passages.A1[0]): string[] => {
  return [
    `Introduction to ${passage.topic}`,
    'Key Challenges and Solutions',
    'Historical Background',
    'Current Developments',
    'Future Prospects',
    'Practical Applications',
    'Expert Perspectives',
    'Conclusion and Recommendations',
  ];
};

const getHeadingAnswer = (passage: typeof passages.A1[0], index: number): string => {
  const options = getHeadingOptions(passage);
  return options[index % options.length];
};

const getInfoTopic = (passage: typeof passages.A1[0], index: number): string => {
  const topics = [
    'the main argument',
    'supporting evidence',
    'potential challenges',
    'historical context',
    'future implications',
    'expert opinions',
  ];
  return topics[index % topics.length];
};

const getFeature = (passage: typeof passages.A1[0], index: number): string => {
  const features = [
    'primary benefit',
    'main challenge',
    'key finding',
    'important consideration',
    'notable development',
  ];
  return features[index % features.length];
};

const getFeatureOptions = (passage: typeof passages.A1[0]): string[] => {
  return [
    'Related to economic factors',
    'Connected to social issues',
    'Associated with technological change',
    'Linked to environmental concerns',
  ];
};

const getFeatureAnswer = (index: number): string => {
  const answers = [
    'Related to economic factors',
    'Connected to social issues',
    'Associated with technological change',
    'Linked to environmental concerns',
  ];
  return answers[index % answers.length];
};

const getSentenceStart = (passage: typeof passages.A1[0], index: number): string => {
  const starts = [
    'The main point of the passage is that...',
    'According to the author...',
    'Research suggests that...',
    'The evidence indicates that...',
    'Experts believe that...',
  ];
  return starts[index % starts.length];
};

const getEndingOptions = (passage: typeof passages.A1[0], index: number): string[] => {
  return [
    'significant progress has been made in this area.',
    'more research is needed to draw conclusions.',
    'the situation is more complex than initially thought.',
    'change is both inevitable and necessary.',
  ];
};

const getEndingAnswer = (index: number): string => {
  const answers = [
    'significant progress has been made in this area.',
    'more research is needed to draw conclusions.',
    'the situation is more complex than initially thought.',
    'change is both inevitable and necessary.',
  ];
  return answers[index % answers.length];
};

const getListQuestion = (passage: typeof passages.A1[0], index: number): string => {
  return `Select TWO factors mentioned in the passage that are important for understanding ${passage.topic}:`;
};

const getListOptions = (passage: typeof passages.A1[0], index: number): string[] => {
  return [
    'Research and evidence',
    'Historical precedent',
    'Expert opinion',
    'Practical experience',
    'Theoretical frameworks',
  ];
};

const getListAnswer = (index: number): string[] => {
  return ['Research and evidence', 'Expert opinion'];
};

const getTitleOptions = (passage: typeof passages.A1[0]): string[] => {
  return [
    passage.title,
    `Understanding ${passage.topic}`,
    `Challenges in ${passage.topic}`,
    `The Future of ${passage.topic}`,
  ];
};

export const getExpandedPassage = (level: CEFRLevel, mockId: number, partNum: number) => {
  const levelPassages = passages[level];
  const passageIndex = (mockId + partNum) % levelPassages.length;
  return levelPassages[passageIndex];
};

export const generateExpandedQuestions = (
  level: CEFRLevel,
  mockId: number,
  partNum: number,
  questionType: QuestionType,
  startId: number,
  count: number = 10
): Part['questions'] => {
  const passage = getExpandedPassage(level, mockId, partNum);
  return generateQuestionsByType(questionType, passage, startId, count);
};

export { passages };
