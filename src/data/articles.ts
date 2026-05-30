export interface ArticleQuestion {
  id: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
}

export interface Article {
  id: string;
  title: string;
  content: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1";
  topic: string;
  readTime: number;
  wordCount: number;
  questions: ArticleQuestion[];
}

export const ARTICLES: Article[] = [
  // ─── A1 ───────────────────────────────────────────────────────────────────
  {
    id: "a1-01",
    title: "My Daily Routine",
    level: "A1", topic: "Daily Life", readTime: 2, wordCount: 120,
    content: `Every day I wake up at 7 o'clock in the morning. First, I wash my face and brush my teeth. Then I eat breakfast. I usually have bread, eggs, and tea for breakfast.

After breakfast, I go to school. School starts at 8 o'clock. I study English, Math, and Science at school. I have lunch at 12 o'clock.

After school, I come home and do my homework. In the evening, I watch TV or read books. I go to bed at 10 o'clock at night. I like my daily routine because it keeps me organized.`,
    questions: [
      { id: "a1-01-q1", question: "What time does the person wake up?", options: { A: "6 o'clock", B: "7 o'clock", C: "8 o'clock", D: "9 o'clock" }, correct: "B" },
      { id: "a1-01-q2", question: "What does the person eat for breakfast?", options: { A: "Rice and milk", B: "Bread, eggs, and tea", C: "Cereal and juice", D: "Pancakes" }, correct: "B" },
      { id: "a1-01-q3", question: "When does school start?", options: { A: "7 o'clock", B: "9 o'clock", C: "8 o'clock", D: "10 o'clock" }, correct: "C" },
      { id: "a1-01-q4", question: "What does the person do in the evening?", options: { A: "Goes to the gym", B: "Watches TV or reads books", C: "Meets friends", D: "Cooks dinner" }, correct: "B" },
      { id: "a1-01-q5", question: "What time does the person go to bed?", options: { A: "9 o'clock", B: "11 o'clock", C: "10 o'clock", D: "12 o'clock" }, correct: "C" },
    ],
  },
  {
    id: "a1-02",
    title: "My Family",
    level: "A1", topic: "Family", readTime: 2, wordCount: 100,
    content: `I have a small family. There are four people in my family. My father's name is John. He is a teacher. My mother's name is Mary. She is a doctor.

I have one sister. Her name is Lisa. She is eight years old. I am ten years old. We live in a small house. Our house has three rooms. We have a garden with flowers.

I love my family very much. We are happy together.`,
    questions: [
      { id: "a1-02-q1", question: "How many people are in the family?", options: { A: "Three", B: "Five", C: "Four", D: "Two" }, correct: "C" },
      { id: "a1-02-q2", question: "What is the father's job?", options: { A: "Doctor", B: "Teacher", C: "Engineer", D: "Driver" }, correct: "B" },
      { id: "a1-02-q3", question: "What is the mother's job?", options: { A: "Teacher", B: "Cook", C: "Doctor", D: "Nurse" }, correct: "C" },
      { id: "a1-02-q4", question: "How old is Lisa?", options: { A: "Ten", B: "Six", C: "Eight", D: "Nine" }, correct: "C" },
      { id: "a1-02-q5", question: "What does the house have?", options: { A: "A swimming pool", B: "A garden with flowers", C: "A big garage", D: "A library" }, correct: "B" },
    ],
  },
  {
    id: "a1-03",
    title: "My Favorite Food",
    level: "A1", topic: "Food", readTime: 2, wordCount: 110,
    content: `I love eating food. My favorite food is pizza. Pizza has bread, cheese, and tomato sauce. I also like hamburgers and french fries.

For breakfast, I eat eggs and toast. I drink orange juice in the morning. For lunch, I have soup and salad. I do not like vegetables very much. But I know vegetables are healthy.

My favorite fruit is apple. Apples are red and sweet. I eat one apple every day. Food gives us energy to work and play.`,
    questions: [
      { id: "a1-03-q1", question: "What is the person's favorite food?", options: { A: "Hamburger", B: "Salad", C: "Pizza", D: "Soup" }, correct: "C" },
      { id: "a1-03-q2", question: "What does the person drink in the morning?", options: { A: "Milk", B: "Orange juice", C: "Tea", D: "Water" }, correct: "B" },
      { id: "a1-03-q3", question: "What does the person eat for lunch?", options: { A: "Pizza and juice", B: "Eggs and toast", C: "Soup and salad", D: "Rice and chicken" }, correct: "C" },
      { id: "a1-03-q4", question: "What is the person's favorite fruit?", options: { A: "Banana", B: "Orange", C: "Apple", D: "Grape" }, correct: "C" },
      { id: "a1-03-q5", question: "How often does the person eat an apple?", options: { A: "Once a week", B: "Every day", C: "Twice a day", D: "Never" }, correct: "B" },
    ],
  },
  {
    id: "a1-04",
    title: "Animals in the Zoo",
    level: "A1", topic: "Animals", readTime: 2, wordCount: 115,
    content: `I visited the zoo last Sunday. The zoo has many animals. I saw lions, tigers, and elephants. Lions are big and have yellow fur. Tigers have orange and black stripes.

Elephants are the biggest animals in the zoo. They have long noses called trunks. I also saw monkeys. Monkeys are funny animals. They climb trees and eat bananas.

My favorite animal is the giraffe. Giraffes have very long necks. They eat leaves from tall trees. The zoo was very exciting.`,
    questions: [
      { id: "a1-04-q1", question: "When did the person visit the zoo?", options: { A: "Saturday", B: "Friday", C: "Sunday", D: "Monday" }, correct: "C" },
      { id: "a1-04-q2", question: "What color is a lion's fur?", options: { A: "White", B: "Yellow", C: "Brown", D: "Grey" }, correct: "B" },
      { id: "a1-04-q3", question: "What is an elephant's long nose called?", options: { A: "Snout", B: "Horn", C: "Trunk", D: "Tusk" }, correct: "C" },
      { id: "a1-04-q4", question: "What do monkeys eat?", options: { A: "Meat", B: "Fish", C: "Bananas", D: "Leaves" }, correct: "C" },
      { id: "a1-04-q5", question: "What is the person's favorite animal?", options: { A: "Lion", B: "Elephant", C: "Monkey", D: "Giraffe" }, correct: "D" },
    ],
  },
  {
    id: "a1-05",
    title: "The Weather",
    level: "A1", topic: "Nature", readTime: 2, wordCount: 118,
    content: `The weather changes every day. Today it is sunny and warm. I like sunny days. On sunny days, I play outside with my friends.

Sometimes the weather is cloudy. When it is cloudy, the sky is grey. It often rains on cloudy days. Rain makes the flowers grow. In winter, it is cold and sometimes it snows.

Snow is white and soft. Children love to play in the snow. In summer, the weather is hot. We go swimming in the pool. What is your favorite weather?`,
    questions: [
      { id: "a1-05-q1", question: "What does the person like to do on sunny days?", options: { A: "Read books", B: "Play outside", C: "Watch TV", D: "Sleep" }, correct: "B" },
      { id: "a1-05-q2", question: "What color is the sky when it is cloudy?", options: { A: "Blue", B: "White", C: "Grey", D: "Orange" }, correct: "C" },
      { id: "a1-05-q3", question: "What does rain help to do?", options: { A: "Makes it cold", B: "Makes flowers grow", C: "Makes snow", D: "Makes it sunny" }, correct: "B" },
      { id: "a1-05-q4", question: "What is snow like?", options: { A: "Hard and yellow", B: "Soft and grey", C: "White and soft", D: "Cold and blue" }, correct: "C" },
      { id: "a1-05-q5", question: "What do people do in summer?", options: { A: "Ski", B: "Play in snow", C: "Go swimming", D: "Wear coats" }, correct: "C" },
    ],
  },
  {
    id: "a1-06",
    title: "My School",
    level: "A1", topic: "Education", readTime: 2, wordCount: 112,
    content: `My school is big and beautiful. It has twenty classrooms. There is a library in my school. I go to the library to read books.

My school also has a sports field. We play football and basketball there. My favorite subject is English. My English teacher is very kind. She teaches us new words every day.

My school starts at 8 in the morning and finishes at 3 in the afternoon. I have many friends at school. We eat lunch together in the cafeteria. I love my school.`,
    questions: [
      { id: "a1-06-q1", question: "How many classrooms does the school have?", options: { A: "Ten", B: "Fifteen", C: "Twenty", D: "Thirty" }, correct: "C" },
      { id: "a1-06-q2", question: "Why does the person go to the library?", options: { A: "To study math", B: "To read books", C: "To meet friends", D: "To eat lunch" }, correct: "B" },
      { id: "a1-06-q3", question: "What is the person's favorite subject?", options: { A: "Math", B: "Science", C: "English", D: "Art" }, correct: "C" },
      { id: "a1-06-q4", question: "When does school finish?", options: { A: "2 o'clock", B: "4 o'clock", C: "3 o'clock", D: "5 o'clock" }, correct: "C" },
      { id: "a1-06-q5", question: "Where do students eat lunch?", options: { A: "In the classroom", B: "In the library", C: "In the cafeteria", D: "Outside" }, correct: "C" },
    ],
  },
  {
    id: "a1-07",
    title: "Sports and Games",
    level: "A1", topic: "Sports", readTime: 2, wordCount: 112,
    content: `I love playing sports. My favorite sport is football. I play football with my friends every weekend. Football is played with a round ball. Two teams play against each other.

I also like swimming. Swimming is good exercise for the whole body. In school, we play basketball. Basketball is played with an orange ball. Players throw the ball into a basket.

My sister likes tennis. She plays tennis on Saturdays. Sports keep us healthy and happy.`,
    questions: [
      { id: "a1-07-q1", question: "What is the person's favorite sport?", options: { A: "Basketball", B: "Swimming", C: "Football", D: "Tennis" }, correct: "C" },
      { id: "a1-07-q2", question: "When does the person play football?", options: { A: "Every day", B: "Every weekend", C: "On Fridays", D: "On Mondays" }, correct: "B" },
      { id: "a1-07-q3", question: "What color is a basketball?", options: { A: "White", B: "Black", C: "Red", D: "Orange" }, correct: "D" },
      { id: "a1-07-q4", question: "What sport does the sister like?", options: { A: "Football", B: "Tennis", C: "Swimming", D: "Basketball" }, correct: "B" },
      { id: "a1-07-q5", question: "What do sports do for us?", options: { A: "Make us tired", B: "Cost money", C: "Keep us healthy and happy", D: "Take time" }, correct: "C" },
    ],
  },
  {
    id: "a1-08",
    title: "Hobbies",
    level: "A1", topic: "Hobbies", readTime: 2, wordCount: 110,
    content: `Everybody has hobbies. A hobby is something you enjoy doing in your free time. My hobby is drawing. I draw pictures of animals and people.

My best friend's hobby is reading books. She reads every evening before bed. My brother likes playing video games. He plays games on his computer.

My father's hobby is gardening. He grows tomatoes and cucumbers. My mother likes cooking. She tries new recipes every week. Hobbies make us happy and help us relax.`,
    questions: [
      { id: "a1-08-q1", question: "What is a hobby?", options: { A: "Your job", B: "Something you enjoy in free time", C: "School work", D: "Daily chores" }, correct: "B" },
      { id: "a1-08-q2", question: "What is the person's hobby?", options: { A: "Reading", B: "Cooking", C: "Drawing", D: "Gaming" }, correct: "C" },
      { id: "a1-08-q3", question: "What does the brother like to do?", options: { A: "Draw", B: "Play video games", C: "Garden", D: "Cook" }, correct: "B" },
      { id: "a1-08-q4", question: "What does the father grow?", options: { A: "Flowers and roses", B: "Tomatoes and cucumbers", C: "Apples and oranges", D: "Potatoes and carrots" }, correct: "B" },
      { id: "a1-08-q5", question: "What do hobbies help us do?", options: { A: "Earn money", B: "Sleep better", C: "Make us happy and relax", D: "Learn faster" }, correct: "C" },
    ],
  },
  {
    id: "a1-09",
    title: "A Trip to the Beach",
    level: "A1", topic: "Travel", readTime: 2, wordCount: 114,
    content: `Last summer, my family went to the beach. The beach was beautiful. The sand was white and soft. The sea was blue and warm.

I swam in the sea with my brother. We also built a sandcastle. My mother sat under an umbrella and read a book. My father went fishing. He caught three fish.

We had a picnic on the beach. We ate sandwiches and drank lemonade. In the evening, we watched the sunset. The sky turned pink and orange. I want to go to the beach again next summer.`,
    questions: [
      { id: "a1-09-q1", question: "When did the family go to the beach?", options: { A: "Last winter", B: "Last spring", C: "Last summer", D: "Last autumn" }, correct: "C" },
      { id: "a1-09-q2", question: "What color was the sand?", options: { A: "Yellow", B: "White", C: "Brown", D: "Grey" }, correct: "B" },
      { id: "a1-09-q3", question: "What did the father do at the beach?", options: { A: "Swam", B: "Built a sandcastle", C: "Read a book", D: "Went fishing" }, correct: "D" },
      { id: "a1-09-q4", question: "What did the family eat at the picnic?", options: { A: "Pizza and juice", B: "Sandwiches and lemonade", C: "Fish and chips", D: "Bread and water" }, correct: "B" },
      { id: "a1-09-q5", question: "What colors did the sky turn at sunset?", options: { A: "Blue and white", B: "Grey and black", C: "Pink and orange", D: "Red and purple" }, correct: "C" },
    ],
  },
  {
    id: "a1-10",
    title: "Seasons",
    level: "A1", topic: "Nature", readTime: 2, wordCount: 112,
    content: `There are four seasons in a year. The seasons are spring, summer, autumn, and winter.

Spring comes after winter. In spring, flowers bloom and birds sing. The weather is warm and nice. Summer is the hottest season. We go on vacation in summer. Children do not go to school.

Autumn comes after summer. Leaves turn yellow, orange, and red in autumn. Winter is the coldest season. We wear warm clothes in winter. It sometimes snows in winter. My favorite season is summer because I can swim and play outside.`,
    questions: [
      { id: "a1-10-q1", question: "How many seasons are there in a year?", options: { A: "Three", B: "Five", C: "Two", D: "Four" }, correct: "D" },
      { id: "a1-10-q2", question: "Which season comes after winter?", options: { A: "Autumn", B: "Spring", C: "Summer", D: "None" }, correct: "B" },
      { id: "a1-10-q3", question: "Which is the hottest season?", options: { A: "Spring", B: "Autumn", C: "Summer", D: "Winter" }, correct: "C" },
      { id: "a1-10-q4", question: "What happens to leaves in autumn?", options: { A: "They grow bigger", B: "They turn green", C: "They fall down only", D: "They turn yellow, orange, and red" }, correct: "D" },
      { id: "a1-10-q5", question: "What is the person's favorite season?", options: { A: "Spring", B: "Summer", C: "Autumn", D: "Winter" }, correct: "B" },
    ],
  },

  // ─── A2 ───────────────────────────────────────────────────────────────────
  {
    id: "a2-01",
    title: "The History of Pizza",
    level: "A2", topic: "Food", readTime: 3, wordCount: 145,
    content: `Pizza is one of the most popular foods in the world. It originally came from Italy. The first pizzas were simple flat breads with tomato and cheese. In Naples, Italy, pizza became very popular in the 18th century.

Italian immigrants brought pizza to America in the late 1800s. In New York, the first pizzeria opened in 1905. During World War II, American soldiers in Italy tried pizza and loved it. When they returned home, they wanted pizza in America too.

Today, pizza is eaten in almost every country. There are hundreds of different types of pizza. The most classic is the Margherita, which has tomato, mozzarella, and basil.`,
    questions: [
      { id: "a2-01-q1", question: "Where did pizza originally come from?", options: { A: "France", B: "Italy", C: "Greece", D: "Spain" }, correct: "B" },
      { id: "a2-01-q2", question: "When did Italian immigrants bring pizza to America?", options: { A: "Early 1700s", B: "Late 1800s", C: "Early 1900s", D: "Mid 1900s" }, correct: "B" },
      { id: "a2-01-q3", question: "When did the first New York pizzeria open?", options: { A: "1890", B: "1895", C: "1905", D: "1910" }, correct: "C" },
      { id: "a2-01-q4", question: "Who helped make pizza popular in America after WWII?", options: { A: "Italian chefs", B: "American soldiers", C: "TV commercials", D: "Italian restaurants" }, correct: "B" },
      { id: "a2-01-q5", question: "What are the ingredients of a Margherita pizza?", options: { A: "Mushrooms, olives, peppers", B: "Meat, onion, garlic", C: "Tomato, mozzarella, basil", D: "Cheese, bacon, herbs" }, correct: "C" },
    ],
  },
  {
    id: "a2-02",
    title: "Social Media and Young People",
    level: "A2", topic: "Technology", readTime: 3, wordCount: 140,
    content: `Social media has changed the way young people communicate. Platforms like Instagram, TikTok, and YouTube are used by millions of teenagers every day. Many young people share photos, videos, and thoughts online.

Social media can be positive. It helps people stay connected with friends and family. It is also a place to learn new things. However, there are some problems. Some young people spend too much time on their phones. This can affect their studies and sleep.

Cyberbullying is also a problem on social media. Parents and teachers should help young people use social media responsibly.`,
    questions: [
      { id: "a2-02-q1", question: "Which platforms are mentioned in the article?", options: { A: "Facebook, Twitter, LinkedIn", B: "Instagram, TikTok, YouTube", C: "Snapchat, Pinterest, Reddit", D: "WhatsApp, Telegram, Viber" }, correct: "B" },
      { id: "a2-02-q2", question: "What is one positive effect of social media?", options: { A: "It wastes time", B: "It causes bullying", C: "It helps people stay connected", D: "It affects sleep" }, correct: "C" },
      { id: "a2-02-q3", question: "What problem can too much phone time cause?", options: { A: "Eye problems only", B: "Better grades", C: "It can affect studies and sleep", D: "More friends" }, correct: "C" },
      { id: "a2-02-q4", question: "What is cyberbullying?", options: { A: "Learning online", B: "Bullying on social media", C: "Playing online games", D: "Watching videos" }, correct: "B" },
      { id: "a2-02-q5", question: "Who should help young people use social media responsibly?", options: { A: "Only parents", B: "Only teachers", C: "Parents and teachers", D: "Only friends" }, correct: "C" },
    ],
  },
  {
    id: "a2-03",
    title: "Healthy Eating Habits",
    level: "A2", topic: "Health", readTime: 3, wordCount: 138,
    content: `Eating healthy is very important for our body and mind. A balanced diet includes fruits, vegetables, proteins, and carbohydrates. Fruits and vegetables give us vitamins and minerals. Proteins like meat, fish, and eggs help our muscles grow.

Carbohydrates like bread and rice give us energy. We should drink at least eight glasses of water every day. Water helps our body function properly. Fast food and sugary drinks should be eaten only occasionally. They contain too much fat and sugar.

Skipping breakfast is a bad habit. Breakfast gives us energy for the whole day. Try to eat three regular meals a day.`,
    questions: [
      { id: "a2-03-q1", question: "What does a balanced diet include?", options: { A: "Only fruits and vegetables", B: "Fruits, vegetables, proteins, carbohydrates", C: "Only proteins and carbohydrates", D: "Fast food and drinks" }, correct: "B" },
      { id: "a2-03-q2", question: "What helps our muscles grow?", options: { A: "Carbohydrates", B: "Vitamins", C: "Proteins", D: "Sugar" }, correct: "C" },
      { id: "a2-03-q3", question: "How many glasses of water should we drink daily?", options: { A: "Four glasses", B: "Six glasses", C: "Eight glasses", D: "Ten glasses" }, correct: "C" },
      { id: "a2-03-q4", question: "Why is skipping breakfast bad?", options: { A: "It makes you fat", B: "Breakfast gives energy for the day", C: "It is expensive", D: "It wastes time" }, correct: "B" },
      { id: "a2-03-q5", question: "How many meals should you eat per day?", options: { A: "One", B: "Two", C: "Four", D: "Three" }, correct: "D" },
    ],
  },
  {
    id: "a2-04",
    title: "The Olympic Games",
    level: "A2", topic: "Sports", readTime: 3, wordCount: 142,
    content: `The Olympic Games are the biggest sporting event in the world. They are held every four years. There are two types of Olympics: the Summer Olympics and the Winter Olympics.

The first modern Olympics were held in Athens, Greece in 1896. Athletes from around the world compete in different sports. In the Summer Olympics, sports include swimming, athletics, gymnastics, and cycling. In the Winter Olympics, sports include skiing, ice skating, and snowboarding.

Winners receive gold, silver, or bronze medals. The Olympic motto is "Faster, Higher, Stronger." The Olympic flag has five colored rings. Each ring represents a continent of the world.`,
    questions: [
      { id: "a2-04-q1", question: "How often are the Olympic Games held?", options: { A: "Every two years", B: "Every year", C: "Every four years", D: "Every three years" }, correct: "C" },
      { id: "a2-04-q2", question: "Where were the first modern Olympics held?", options: { A: "Rome, Italy", B: "Athens, Greece", C: "Paris, France", D: "London, England" }, correct: "B" },
      { id: "a2-04-q3", question: "Which sport is in the Winter Olympics?", options: { A: "Swimming", B: "Cycling", C: "Athletics", D: "Skiing" }, correct: "D" },
      { id: "a2-04-q4", question: "What is the Olympic motto?", options: { A: "Run, Jump, Swim", B: "Peace, Love, Sport", C: "Faster, Higher, Stronger", D: "Win, Compete, Excel" }, correct: "C" },
      { id: "a2-04-q5", question: "How many rings are on the Olympic flag?", options: { A: "Four", B: "Six", C: "Seven", D: "Five" }, correct: "D" },
    ],
  },
  {
    id: "a2-05",
    title: "Going Green: Simple Steps",
    level: "A2", topic: "Environment", readTime: 3, wordCount: 138,
    content: `Climate change is a serious problem. We can all help protect our planet by making small changes.

First, we can save energy at home. Turn off lights when you leave a room. Use energy-saving light bulbs. Second, reduce plastic use. Bring your own bag when shopping. Say no to plastic straws. Third, recycle paper, glass, and metal.

Fourth, use public transport or a bicycle instead of a car. Cars produce a lot of carbon dioxide. Fifth, eat less meat. Meat production uses a lot of water and land. Small changes in our daily habits can make a big difference for the environment.`,
    questions: [
      { id: "a2-05-q1", question: "What is the main topic of the article?", options: { A: "Global warming facts", B: "Simple ways to help the environment", C: "How to save money", D: "Recycling laws" }, correct: "B" },
      { id: "a2-05-q2", question: "What should you bring when shopping?", options: { A: "A cart", B: "Your own bag", C: "A plastic bag", D: "A box" }, correct: "B" },
      { id: "a2-05-q3", question: "What do cars produce that harms the environment?", options: { A: "Oxygen", B: "Water vapor", C: "Carbon dioxide", D: "Nitrogen" }, correct: "C" },
      { id: "a2-05-q4", question: "Why should we eat less meat?", options: { A: "It is unhealthy", B: "It is expensive", C: "Meat production uses a lot of water and land", D: "Animals are endangered" }, correct: "C" },
      { id: "a2-05-q5", question: "What materials should be recycled?", options: { A: "Food and water", B: "Paper, glass, and metal", C: "Clothes and shoes", D: "Wood and stone" }, correct: "B" },
    ],
  },
  {
    id: "a2-06",
    title: "Learning a Foreign Language",
    level: "A2", topic: "Education", readTime: 3, wordCount: 140,
    content: `Learning a foreign language is one of the most valuable things you can do. It opens doors to new cultures and opportunities.

English is the most widely spoken language in the world. It is used in international business, science, and culture. Spanish is the second most spoken language. Mandarin Chinese is spoken by the most native speakers.

The best way to learn a language is through practice. Speak the language as much as possible. Watch movies and TV shows in the language. Read books and listen to music. Use language learning apps like Duolingo.

Do not be afraid of making mistakes. Mistakes are part of the learning process. Even a basic knowledge of another language is useful.`,
    questions: [
      { id: "a2-06-q1", question: "What is the most widely spoken language in the world?", options: { A: "Spanish", B: "Mandarin", C: "French", D: "English" }, correct: "D" },
      { id: "a2-06-q2", question: "Which language is spoken by the most native speakers?", options: { A: "English", B: "Spanish", C: "Mandarin Chinese", D: "Arabic" }, correct: "C" },
      { id: "a2-06-q3", question: "What is the best way to learn a language?", options: { A: "Reading grammar books", B: "Through practice", C: "Memorizing words", D: "Taking exams" }, correct: "B" },
      { id: "a2-06-q4", question: "What is mentioned as a language learning app?", options: { A: "Babbel", B: "Rosetta Stone", C: "Duolingo", D: "Memrise" }, correct: "C" },
      { id: "a2-06-q5", question: "What should you not be afraid of when learning a language?", options: { A: "Listening", B: "Speaking to natives", C: "Making mistakes", D: "Reading" }, correct: "C" },
    ],
  },
  {
    id: "a2-07",
    title: "A Visit to London",
    level: "A2", topic: "Travel", readTime: 3, wordCount: 145,
    content: `London is the capital city of England and the United Kingdom. It is one of the most visited cities in the world. The city is famous for its history, culture, and landmarks.

The most famous landmark is Big Ben, the large clock tower near the Houses of Parliament. The Tower of London is a historic castle by the River Thames. Buckingham Palace is where the King lives. The London Eye is a giant Ferris wheel with great views of the city.

London has excellent museums, many of which are free. The British Museum has ancient artifacts from around the world. London is also a multicultural city with people from many different countries.`,
    questions: [
      { id: "a2-07-q1", question: "What is London the capital of?", options: { A: "Scotland", B: "England and the UK", C: "Europe", D: "France" }, correct: "B" },
      { id: "a2-07-q2", question: "What is Big Ben?", options: { A: "A museum", B: "A palace", C: "A large clock tower", D: "A Ferris wheel" }, correct: "C" },
      { id: "a2-07-q3", question: "Where does the King live?", options: { A: "The Tower of London", B: "Big Ben", C: "Buckingham Palace", D: "The British Museum" }, correct: "C" },
      { id: "a2-07-q4", question: "What is the London Eye?", options: { A: "A famous clock", B: "A giant Ferris wheel", C: "A museum", D: "A castle" }, correct: "B" },
      { id: "a2-07-q5", question: "What does the British Museum contain?", options: { A: "Modern art", B: "Science exhibitions", C: "Ancient artifacts from around the world", D: "Sports history" }, correct: "C" },
    ],
  },
  {
    id: "a2-08",
    title: "Money and Saving",
    level: "A2", topic: "Finance", readTime: 3, wordCount: 140,
    content: `Managing money is an important life skill. Many young people do not learn about money at school. Understanding how to save and spend wisely can prevent financial problems later in life.

A budget is a plan for how to use your money. It shows how much you earn and how much you spend. The golden rule of saving is: spend less than you earn. Put some money aside each month, even if it is a small amount.

Avoid spending on things you do not need. Credit cards can be useful but dangerous. If you spend more than you can pay back, you will have debt. Learning to save early in life creates good habits for the future.`,
    questions: [
      { id: "a2-08-q1", question: "What is a budget?", options: { A: "A type of credit card", B: "A plan for how to use money", C: "A bank account", D: "A saving goal" }, correct: "B" },
      { id: "a2-08-q2", question: "What is the golden rule of saving?", options: { A: "Earn more money", B: "Never use credit cards", C: "Spend less than you earn", D: "Save 50% of income" }, correct: "C" },
      { id: "a2-08-q3", question: "What happens if you spend more than you can pay back on a credit card?", options: { A: "You get a reward", B: "You have debt", C: "Your account is closed", D: "Nothing happens" }, correct: "B" },
      { id: "a2-08-q4", question: "When is the best time to learn to save?", options: { A: "After retirement", B: "In middle age", C: "Early in life", D: "When you have problems" }, correct: "C" },
      { id: "a2-08-q5", question: "What should you avoid spending money on?", options: { A: "Food and water", B: "Things you do not need", C: "Education", D: "Health care" }, correct: "B" },
    ],
  },
  {
    id: "a2-09",
    title: "Traditional Uzbek Cuisine",
    level: "A2", topic: "Culture", readTime: 3, wordCount: 140,
    content: `Uzbek cuisine is one of the richest in Central Asia. The most famous dish is plov, also known as pilaf. Plov is made with rice, meat, carrots, and onions. It is cooked in a large round pot called a kazan.

Another popular dish is shurpa, a hearty soup with meat and vegetables. Samsa are triangular pastries filled with meat and onion. They are baked in a clay oven called a tandoor.

Bread, called non, is very important in Uzbek culture. It is baked in the tandoor and has a unique taste. Uzbek people are known for their hospitality. Guests are always offered tea and sweets.`,
    questions: [
      { id: "a2-09-q1", question: "What is the most famous Uzbek dish?", options: { A: "Shurpa", B: "Samsa", C: "Plov", D: "Non" }, correct: "C" },
      { id: "a2-09-q2", question: "What is a kazan?", options: { A: "A type of bread", B: "A large round pot", C: "A clay oven", D: "A soup bowl" }, correct: "B" },
      { id: "a2-09-q3", question: "What shape are samsa?", options: { A: "Round", B: "Square", C: "Oval", D: "Triangular" }, correct: "D" },
      { id: "a2-09-q4", question: "What is the Uzbek word for bread?", options: { A: "Kazan", B: "Plov", C: "Non", D: "Tandoor" }, correct: "C" },
      { id: "a2-09-q5", question: "What are Uzbek people known for?", options: { A: "Their cooking skills", B: "Their hospitality", C: "Their music", D: "Their dancing" }, correct: "B" },
    ],
  },
  {
    id: "a2-10",
    title: "City Life vs Country Life",
    level: "A2", topic: "Society", readTime: 3, wordCount: 140,
    content: `Many people debate whether it is better to live in a city or in the countryside. City life offers many opportunities. There are more jobs, better hospitals, and more entertainment. Public transport makes it easy to get around without a car.

However, cities can be noisy, crowded, and expensive. Air pollution is a problem in many large cities. Country life, on the other hand, is quieter and cleaner. Nature is all around you. The cost of living is usually lower.

However, there are fewer job opportunities and services may be far away. Public transport is limited. Many people choose to live in suburbs, which offer a balance between city and country living.`,
    questions: [
      { id: "a2-10-q1", question: "What is one advantage of city life?", options: { A: "Cleaner air", B: "More job opportunities", C: "Cheaper housing", D: "More nature" }, correct: "B" },
      { id: "a2-10-q2", question: "What is a problem in many large cities?", options: { A: "Too many trees", B: "Too quiet", C: "Air pollution", D: "No hospitals" }, correct: "C" },
      { id: "a2-10-q3", question: "What is one advantage of country life?", options: { A: "Better hospitals", B: "More entertainment", C: "Quieter and cleaner", D: "Better public transport" }, correct: "C" },
      { id: "a2-10-q4", question: "What is limited in the countryside?", options: { A: "Nature", B: "Space", C: "Public transport", D: "Fresh air" }, correct: "C" },
      { id: "a2-10-q5", question: "What do suburbs offer?", options: { A: "Only city advantages", B: "Only country advantages", C: "A balance between city and country", D: "Neither city nor country advantages" }, correct: "C" },
    ],
  },

  // ─── B1 ───────────────────────────────────────────────────────────────────
  {
    id: "b1-01",
    title: "The Psychology of Habits",
    level: "B1", topic: "Psychology", readTime: 4, wordCount: 155,
    content: `Habits shape our daily lives in profound ways. According to researchers, approximately 40% of our daily actions are habitual rather than conscious decisions.

A habit consists of three components: a cue, a routine, and a reward. The cue triggers the behavior. The routine is the behavior itself. The reward reinforces it. Understanding this loop is the first step to changing unwanted habits.

To build a new habit, attach it to an existing one. This is called habit stacking. For example, if you want to start meditating, do it right after brushing your teeth. Consistency is more important than intensity when building habits. Small, daily actions compound over time into significant results.`,
    questions: [
      { id: "b1-01-q1", question: "What percentage of daily actions are habitual?", options: { A: "20%", B: "30%", C: "40%", D: "50%" }, correct: "C" },
      { id: "b1-01-q2", question: "What are the three components of a habit?", options: { A: "Goal, action, result", B: "Cue, routine, reward", C: "Trigger, behavior, outcome", D: "Start, middle, end" }, correct: "B" },
      { id: "b1-01-q3", question: "What is 'habit stacking'?", options: { A: "Doing many habits at once", B: "Attaching a new habit to an existing one", C: "Removing bad habits", D: "Writing habits in a list" }, correct: "B" },
      { id: "b1-01-q4", question: "What is more important than intensity when building habits?", options: { A: "Motivation", B: "Speed", C: "Consistency", D: "Effort" }, correct: "C" },
      { id: "b1-01-q5", question: "What does the cue do in the habit loop?", options: { A: "It rewards the behavior", B: "It is the behavior itself", C: "It triggers the behavior", D: "It stops the behavior" }, correct: "C" },
    ],
  },
  {
    id: "b1-02",
    title: "The Importance of Sleep",
    level: "B1", topic: "Health", readTime: 4, wordCount: 158,
    content: `Sleep is often undervalued in our busy modern society. Many people sacrifice sleep to work longer or spend more time on screens. However, research consistently shows that adequate sleep is essential for physical and mental health.

During sleep, the brain consolidates memories and processes information learned during the day. The body repairs tissues and produces hormones during deep sleep. Adults need between 7-9 hours of sleep per night. Teenagers require 8-10 hours.

Chronic sleep deprivation is linked to increased risk of obesity, diabetes, heart disease, and depression. Poor sleep also impairs concentration, decision-making, and emotional regulation. Establishing a regular sleep schedule and avoiding screens before bed are effective strategies for improving sleep quality.`,
    questions: [
      { id: "b1-02-q1", question: "What happens to memories during sleep?", options: { A: "They are erased", B: "They are consolidated", C: "They are transferred", D: "They are created" }, correct: "B" },
      { id: "b1-02-q2", question: "How many hours of sleep do adults need?", options: { A: "5-6 hours", B: "6-7 hours", C: "7-9 hours", D: "9-11 hours" }, correct: "C" },
      { id: "b1-02-q3", question: "Which is NOT linked to sleep deprivation?", options: { A: "Obesity", B: "Heart disease", C: "Better eyesight", D: "Depression" }, correct: "C" },
      { id: "b1-02-q4", question: "What does poor sleep impair?", options: { A: "Physical strength only", B: "Concentration and decision-making", C: "Digestion", D: "Hair growth" }, correct: "B" },
      { id: "b1-02-q5", question: "What is recommended to improve sleep?", options: { A: "Exercise right before bed", B: "Drink coffee in the evening", C: "Avoid screens before bed", D: "Sleep at different times" }, correct: "C" },
    ],
  },
  {
    id: "b1-03",
    title: "Climate Change: Causes and Solutions",
    level: "B1", topic: "Environment", readTime: 4, wordCount: 162,
    content: `Climate change is arguably the most significant challenge facing humanity in the 21st century. The Earth's average temperature has risen by approximately 1.1 degrees Celsius since the industrial revolution.

The primary cause is the increased concentration of greenhouse gases, particularly carbon dioxide and methane, in the atmosphere. These gases trap heat from the sun, warming the planet. The consequences of climate change include more frequent extreme weather events, rising sea levels, and disruption to ecosystems.

To address climate change, we must transition from fossil fuels to renewable energy sources such as solar and wind power. Reducing deforestation and improving energy efficiency are also critical steps. International cooperation, as seen in the Paris Agreement, is essential.`,
    questions: [
      { id: "b1-03-q1", question: "How much has Earth's temperature risen since the industrial revolution?", options: { A: "0.5°C", B: "1.1°C", C: "2.0°C", D: "1.5°C" }, correct: "B" },
      { id: "b1-03-q2", question: "What is the primary cause of climate change?", options: { A: "Volcanic eruptions", B: "Solar activity", C: "Greenhouse gases", D: "Ocean currents" }, correct: "C" },
      { id: "b1-03-q3", question: "Which gases are particularly mentioned?", options: { A: "Oxygen and nitrogen", B: "Hydrogen and helium", C: "Carbon dioxide and methane", D: "Ozone and argon" }, correct: "C" },
      { id: "b1-03-q4", question: "What is NOT mentioned as a consequence of climate change?", options: { A: "Extreme weather events", B: "Rising sea levels", C: "Ecosystem disruption", D: "Better crop yields" }, correct: "D" },
      { id: "b1-03-q5", question: "What international agreement is mentioned?", options: { A: "Kyoto Protocol", B: "Montreal Protocol", C: "Paris Agreement", D: "Copenhagen Accord" }, correct: "C" },
    ],
  },
  {
    id: "b1-04",
    title: "The Benefits of Exercise",
    level: "B1", topic: "Health", readTime: 4, wordCount: 155,
    content: `Physical exercise is one of the most powerful medicines available to us. Regular exercise reduces the risk of numerous chronic diseases, including heart disease, type 2 diabetes, and several forms of cancer. It strengthens muscles and bones, improves cardiovascular health, and helps maintain a healthy weight.

Beyond the physical benefits, exercise has profound effects on mental health. It triggers the release of endorphins, neurotransmitters that reduce pain and create feelings of wellbeing. Regular physical activity is as effective as antidepressants for treating mild to moderate depression.

Exercise also improves sleep quality, enhances cognitive function, and boosts self-esteem. Health guidelines recommend at least 150 minutes of moderate-intensity exercise per week.`,
    questions: [
      { id: "b1-04-q1", question: "What chemical does exercise trigger in the brain?", options: { A: "Serotonin", B: "Dopamine", C: "Endorphins", D: "Cortisol" }, correct: "C" },
      { id: "b1-04-q2", question: "Exercise is as effective as what for mild depression?", options: { A: "Therapy", B: "Antidepressants", C: "Meditation", D: "Rest" }, correct: "B" },
      { id: "b1-04-q3", question: "How many minutes of exercise per week are recommended?", options: { A: "100 minutes", B: "120 minutes", C: "150 minutes", D: "200 minutes" }, correct: "C" },
      { id: "b1-04-q4", question: "Which disease is NOT mentioned as being reduced by exercise?", options: { A: "Heart disease", B: "Diabetes", C: "Cancer", D: "Alzheimer's" }, correct: "D" },
      { id: "b1-04-q5", question: "What do endorphins do?", options: { A: "Cause stress", B: "Reduce pain and create wellbeing", C: "Increase heart rate", D: "Build muscle" }, correct: "B" },
    ],
  },
  {
    id: "b1-05",
    title: "Renewable Energy",
    level: "B1", topic: "Environment", readTime: 4, wordCount: 160,
    content: `The transition from fossil fuels to renewable energy is one of the most important challenges of our time. Renewable energy comes from natural sources that are constantly replenished, such as sunlight, wind, rain, tides, and geothermal heat.

Solar power has experienced a dramatic reduction in cost over the past decade, making it competitive with fossil fuels in many markets. Wind energy is now the cheapest source of electricity in many parts of the world. Hydropower has been generating electricity for over a century and provides about 16% of global electricity.

The main challenge for renewable energy is intermittency — the sun does not always shine, and the wind does not always blow. Developing better energy storage solutions, particularly batteries, is therefore crucial.`,
    questions: [
      { id: "b1-05-q1", question: "What is intermittency in renewable energy?", options: { A: "High cost of energy", B: "The fact that sun and wind are not always available", C: "Environmental damage", D: "Low efficiency" }, correct: "B" },
      { id: "b1-05-q2", question: "What percentage of global electricity does hydropower provide?", options: { A: "10%", B: "16%", C: "20%", D: "25%" }, correct: "B" },
      { id: "b1-05-q3", question: "Which energy source is now the cheapest in many parts of the world?", options: { A: "Solar", B: "Nuclear", C: "Wind", D: "Hydro" }, correct: "C" },
      { id: "b1-05-q4", question: "What is crucial to solve the intermittency problem?", options: { A: "More solar panels", B: "Better energy storage", C: "Nuclear power", D: "Reducing consumption" }, correct: "B" },
      { id: "b1-05-q5", question: "Which is NOT a renewable energy source mentioned?", options: { A: "Sunlight", B: "Nuclear", C: "Wind", D: "Tides" }, correct: "B" },
    ],
  },
  {
    id: "b1-06",
    title: "Stress and How to Manage It",
    level: "B1", topic: "Health", readTime: 4, wordCount: 160,
    content: `Stress is the body's response to challenging situations. When we perceive a threat, the brain triggers the release of hormones like adrenaline and cortisol. These cause the "fight or flight" response: increased heart rate, faster breathing, and heightened alertness.

In short bursts, this response is useful. However, chronic stress — when the stress response is constantly activated — is harmful to health. It can lead to anxiety, depression, digestive problems, and cardiovascular disease.

Effective stress management techniques include regular exercise, which burns off stress hormones. Mindfulness meditation teaches us to observe thoughts without reacting to them. Deep breathing activates the parasympathetic nervous system, counteracting the stress response. Maintaining social connections provides emotional support during difficult times.`,
    questions: [
      { id: "b1-06-q1", question: "What hormones are released during stress?", options: { A: "Insulin and glucagon", B: "Adrenaline and cortisol", C: "Estrogen and testosterone", D: "Melatonin and serotonin" }, correct: "B" },
      { id: "b1-06-q2", question: "What is the 'fight or flight' response?", options: { A: "A type of exercise", B: "Increased heart rate, breathing, alertness", C: "A relaxation technique", D: "A breathing exercise" }, correct: "B" },
      { id: "b1-06-q3", question: "What does chronic stress lead to?", options: { A: "Better performance", B: "More energy", C: "Anxiety and cardiovascular disease", D: "Better focus" }, correct: "C" },
      { id: "b1-06-q4", question: "What does mindfulness meditation teach?", options: { A: "To react quickly", B: "To observe thoughts without reacting", C: "To ignore problems", D: "To exercise more" }, correct: "B" },
      { id: "b1-06-q5", question: "What does exercise do to stress hormones?", options: { A: "Increases them", B: "Has no effect", C: "Burns them off", D: "Creates more" }, correct: "C" },
    ],
  },
  {
    id: "b1-07",
    title: "Globalization: Benefits and Challenges",
    level: "B1", topic: "Society", readTime: 4, wordCount: 162,
    content: `Globalization refers to the increasing interconnection of countries through trade, technology, and culture. Over the past century, and especially since the internet revolution, the world has become more connected than ever.

Globalization has brought undeniable benefits. It has lifted millions of people out of poverty in developing countries. It has increased access to goods, services, and information. Cultural exchange has enriched societies worldwide.

However, globalization also presents challenges. Income inequality has grown, with the benefits of globalization not evenly distributed. Local cultures and languages face pressure from dominant global cultures. Environmental problems like climate change require global cooperation to solve. The challenge for the modern world is to maximize the benefits of globalization while minimizing its negative effects.`,
    questions: [
      { id: "b1-07-q1", question: "What does globalization refer to?", options: { A: "The study of geography", B: "Increasing interconnection of countries", C: "International tourism", D: "Global trade only" }, correct: "B" },
      { id: "b1-07-q2", question: "What has globalization done for developing countries?", options: { A: "Increased poverty", B: "Lifted millions out of poverty", C: "Reduced trade", D: "Isolated them" }, correct: "B" },
      { id: "b1-07-q3", question: "What is a challenge of globalization?", options: { A: "Decreased trade", B: "Less technology", C: "Growing income inequality", D: "Less cultural exchange" }, correct: "C" },
      { id: "b1-07-q4", question: "What do local cultures face due to globalization?", options: { A: "More support", B: "Pressure from dominant global cultures", C: "No change", D: "Government protection" }, correct: "B" },
      { id: "b1-07-q5", question: "What is the challenge for the modern world regarding globalization?", options: { A: "Stop globalization", B: "Maximize benefits while minimizing negative effects", C: "Increase inequality", D: "Reduce trade" }, correct: "B" },
    ],
  },
  {
    id: "b1-08",
    title: "The Human Brain",
    level: "B1", topic: "Science", readTime: 4, wordCount: 158,
    content: `The human brain is the most complex organ in the known universe. Weighing approximately 1.4 kilograms, it contains around 86 billion neurons. These neurons communicate through trillions of connections called synapses.

The brain controls all functions of the body, including thought, memory, emotion, and movement. It is divided into two hemispheres: the left and the right. The left hemisphere generally controls language and logical thinking. The right hemisphere is associated with creativity and spatial awareness.

The prefrontal cortex, located at the front of the brain, is responsible for decision-making and impulse control. Remarkably, the brain can reorganize itself through a process called neuroplasticity, meaning we can literally change our brains through learning and experience.`,
    questions: [
      { id: "b1-08-q1", question: "How much does the human brain weigh?", options: { A: "1.0 kg", B: "1.4 kg", C: "2.0 kg", D: "0.8 kg" }, correct: "B" },
      { id: "b1-08-q2", question: "What are synapses?", options: { A: "Types of neurons", B: "Brain diseases", C: "Connections between neurons", D: "Parts of the brain" }, correct: "C" },
      { id: "b1-08-q3", question: "Which hemisphere controls language?", options: { A: "Right", B: "Both equally", C: "Neither", D: "Left" }, correct: "D" },
      { id: "b1-08-q4", question: "What is neuroplasticity?", options: { A: "Brain surgery", B: "The brain reorganizing itself", C: "Loss of memory", D: "Brain damage" }, correct: "B" },
      { id: "b1-08-q5", question: "What is the prefrontal cortex responsible for?", options: { A: "Breathing", B: "Vision", C: "Emotion only", D: "Decision-making and impulse control" }, correct: "D" },
    ],
  },
  {
    id: "b1-09",
    title: "Space Exploration",
    level: "B1", topic: "Science", readTime: 4, wordCount: 162,
    content: `The exploration of space represents one of humanity's greatest intellectual and technical achievements. The Space Age began on October 4, 1957, when the Soviet Union launched Sputnik, the first artificial satellite.

In 1961, Yuri Gagarin became the first human to orbit Earth. The United States responded with the Apollo program, which landed astronauts on the Moon in 1969. After the end of the Cold War, international cooperation in space increased.

The International Space Station, a joint project involving 15 countries, has been continuously inhabited since 2000. Today, a new era of space exploration is underway, driven partly by private companies like SpaceX and Blue Origin. Plans for human missions to Mars are being developed. Space exploration has produced numerous technological benefits, from GPS to memory foam.`,
    questions: [
      { id: "b1-09-q1", question: "When did the Space Age begin?", options: { A: "1950", B: "1957", C: "1961", D: "1969" }, correct: "B" },
      { id: "b1-09-q2", question: "Who was the first human to orbit Earth?", options: { A: "Neil Armstrong", B: "Buzz Aldrin", C: "Yuri Gagarin", D: "Alan Shepard" }, correct: "C" },
      { id: "b1-09-q3", question: "When did astronauts land on the Moon?", options: { A: "1965", B: "1967", C: "1971", D: "1969" }, correct: "D" },
      { id: "b1-09-q4", question: "How many countries are involved in the ISS?", options: { A: "10", B: "15", C: "20", D: "25" }, correct: "B" },
      { id: "b1-09-q5", question: "Which private companies are mentioned?", options: { A: "Boeing and Lockheed", B: "NASA and ESA", C: "SpaceX and Blue Origin", D: "Virgin and Airbus" }, correct: "C" },
    ],
  },
  {
    id: "b1-10",
    title: "Economic Inequality",
    level: "B1", topic: "Society", readTime: 4, wordCount: 158,
    content: `Economic inequality — the gap between the rich and the poor — has grown in most countries over the past four decades. According to Oxfam, the 26 wealthiest individuals in the world own as much wealth as the poorest 50% of humanity.

The causes of inequality are complex and debated. Technological change has increased rewards for highly skilled workers while reducing demand for routine jobs. Globalization has benefited some workers while displacing others. Tax policies in many countries have favored the wealthy.

The consequences of extreme inequality are concerning. High inequality is associated with lower social mobility, worse health outcomes, and higher crime rates. Policies such as progressive taxation, investment in education, and stronger labor rights can help reduce inequality.`,
    questions: [
      { id: "b1-10-q1", question: "How many of the wealthiest individuals own as much as the poorest 50%?", options: { A: "10", B: "26", C: "50", D: "100" }, correct: "B" },
      { id: "b1-10-q2", question: "What has technological change done to routine jobs?", options: { A: "Increased demand", B: "Reduced demand", C: "Had no effect", D: "Created more" }, correct: "B" },
      { id: "b1-10-q3", question: "What is associated with high inequality?", options: { A: "Better health outcomes", B: "Higher social mobility", C: "Lower crime rates", D: "Lower social mobility" }, correct: "D" },
      { id: "b1-10-q4", question: "Which organization provided the statistic about wealthy individuals?", options: { A: "World Bank", B: "IMF", C: "Oxfam", D: "UN" }, correct: "C" },
      { id: "b1-10-q5", question: "What policy is suggested to help reduce inequality?", options: { A: "Cutting education budgets", B: "Reducing labor rights", C: "Progressive taxation", D: "Lowering taxes for all" }, correct: "C" },
    ],
  },

  // ─── B2 ───────────────────────────────────────────────────────────────────
  {
    id: "b2-01",
    title: "The Neuroscience of Creativity",
    level: "B2", topic: "Science", readTime: 5, wordCount: 175,
    content: `Creativity has long been considered a mysterious, almost magical process. Recent advances in neuroscience, however, are beginning to reveal its biological basis. Contrary to the popular belief that creativity is a right-brain activity, neuroimaging studies show that creative thinking engages an extensive network of brain regions, including the default mode network.

The default mode network is active during daydreaming and imagination. The most creative moments often occur when we are not actively focusing on a problem — in the shower, on a walk, or just before sleep. This is when the default mode network is most active, making surprising connections between seemingly unrelated ideas.

Studies suggest that creative people have greater connectivity between different brain networks and can switch between focused attention and relaxed, associative thinking more fluidly than less creative individuals.`,
    questions: [
      { id: "b2-01-q1", question: "What does the default mode network do?", options: { A: "Controls motor function", B: "Manages sleep cycles", C: "Is active during daydreaming and imagination", D: "Regulates breathing" }, correct: "C" },
      { id: "b2-01-q2", question: "What is the popular misconception about creativity?", options: { A: "It is a left-brain activity", B: "It is a right-brain activity", C: "It requires no thinking", D: "It cannot be learned" }, correct: "B" },
      { id: "b2-01-q3", question: "When do creative moments most often occur?", options: { A: "During intense focus", B: "When not actively focusing on a problem", C: "Only in the morning", D: "During sleep" }, correct: "B" },
      { id: "b2-01-q4", question: "What characterizes creative people's brains?", options: { A: "Larger right hemisphere", B: "Greater connectivity between brain networks", C: "More neurons", D: "Slower processing" }, correct: "B" },
      { id: "b2-01-q5", question: "What does 'neuroimaging' study?", options: { A: "Brain surgery techniques", B: "Neural connections visible through imaging", C: "Medication effects", D: "Sleep patterns" }, correct: "B" },
    ],
  },
  {
    id: "b2-02",
    title: "The Ethics of Artificial Intelligence",
    level: "B2", topic: "Technology", readTime: 5, wordCount: 178,
    content: `As artificial intelligence systems become increasingly capable and pervasive, the ethical questions they raise become ever more pressing. Bias in AI is a significant concern. Since AI systems learn from historical data, they can perpetuate and even amplify existing social biases.

Facial recognition systems, for example, have been shown to be less accurate for women and people with darker skin tones. Autonomous weapons — drones or robots that can make lethal decisions without human intervention — raise profound moral questions about accountability.

The potential economic disruption caused by AI automation threatens millions of jobs. Perhaps most fundamental is the question of transparency: when an AI system makes a consequential decision, such as denying someone a loan or parole, can its reasoning be understood and challenged?`,
    questions: [
      { id: "b2-02-q1", question: "Why can AI systems perpetuate social biases?", options: { A: "They are programmed to be biased", B: "They learn from historical data", C: "Their creators are biased", D: "They lack computing power" }, correct: "B" },
      { id: "b2-02-q2", question: "What problem do facial recognition systems have?", options: { A: "They are too slow", B: "They are too expensive", C: "Less accurate for women and darker skin tones", D: "They invade privacy" }, correct: "C" },
      { id: "b2-02-q3", question: "What do autonomous weapons raise questions about?", options: { A: "Cost and efficiency", B: "Accountability", C: "Military strategy", D: "International law only" }, correct: "B" },
      { id: "b2-02-q4", question: "What is the 'transparency' problem in AI?", options: { A: "AI systems are invisible", B: "AI decisions cannot be understood or challenged", C: "AI data is not shared", D: "AI systems are too complex to build" }, correct: "B" },
      { id: "b2-02-q5", question: "What economic concern does AI automation raise?", options: { A: "Higher wages", B: "Threatening millions of jobs", C: "Lower productivity", D: "More expensive goods" }, correct: "B" },
    ],
  },
  {
    id: "b2-03",
    title: "Cognitive Biases and Decision Making",
    level: "B2", topic: "Psychology", readTime: 5, wordCount: 175,
    content: `Human thinking is fundamentally flawed in predictable ways. Cognitive biases are systematic errors in thinking that affect our judgments and decisions. The confirmation bias leads us to seek and interpret information in ways that confirm our existing beliefs.

The availability heuristic causes us to overestimate the likelihood of events that come easily to mind. The sunk cost fallacy leads us to continue investing in failing projects because of the resources already committed. Loss aversion means we feel the pain of losses more acutely than equivalent gains.

Understanding these biases does not eliminate them, but awareness is the first step. Strategies such as seeking disconfirming evidence, using systematic decision frameworks, and soliciting outside perspectives can help mitigate the effects of cognitive biases.`,
    questions: [
      { id: "b2-03-q1", question: "What is the confirmation bias?", options: { A: "Ignoring all information", B: "Seeking information that confirms existing beliefs", C: "Being overconfident", D: "Making random decisions" }, correct: "B" },
      { id: "b2-03-q2", question: "What is the sunk cost fallacy?", options: { A: "Refusing to invest in anything", B: "Continuing investment in failing projects due to past costs", C: "Avoiding financial decisions", D: "Always choosing the cheapest option" }, correct: "B" },
      { id: "b2-03-q3", question: "What does loss aversion describe?", options: { A: "Avoiding all risks", B: "Feeling losses more acutely than equivalent gains", C: "Seeking losses", D: "Ignoring financial losses" }, correct: "B" },
      { id: "b2-03-q4", question: "What is the first step to managing cognitive biases?", options: { A: "Eliminating them completely", B: "Ignoring them", C: "Awareness", D: "Seeking expert help" }, correct: "C" },
      { id: "b2-03-q5", question: "What strategy can help mitigate biases?", options: { A: "Making quick decisions", B: "Seeking disconfirming evidence", C: "Trusting your gut", D: "Avoiding decisions" }, correct: "B" },
    ],
  },
  {
    id: "b2-04",
    title: "Antibiotic Resistance: A Global Crisis",
    level: "B2", topic: "Health", readTime: 5, wordCount: 178,
    content: `Antibiotic resistance is one of the most serious threats to global public health. Since Alexander Fleming discovered penicillin in 1928, antibiotics have saved hundreds of millions of lives by treating bacterial infections.

However, bacteria evolve resistance to antibiotics through natural selection. Each time antibiotics are used, bacteria that happen to be resistant survive and reproduce. The overuse and misuse of antibiotics has dramatically accelerated this process. Antibiotics are frequently prescribed unnecessarily for viral infections, against which they are ineffective.

In many countries, antibiotics are available without prescription. In agriculture, they are routinely administered to healthy animals to promote growth. If current trends continue, antibiotic-resistant infections could kill 10 million people per year by 2050.`,
    questions: [
      { id: "b2-04-q1", question: "Who discovered penicillin?", options: { A: "Louis Pasteur", B: "Marie Curie", C: "Alexander Fleming", D: "Edward Jenner" }, correct: "C" },
      { id: "b2-04-q2", question: "How do bacteria develop antibiotic resistance?", options: { A: "Through genetic engineering", B: "Through natural selection", C: "Through mutation only", D: "Through viral infection" }, correct: "B" },
      { id: "b2-04-q3", question: "Why is it wrong to prescribe antibiotics for viral infections?", options: { A: "They are too expensive", B: "They cause side effects", C: "They are ineffective against viruses", D: "They are too strong" }, correct: "C" },
      { id: "b2-04-q4", question: "How are antibiotics misused in agriculture?", options: { A: "Given to sick animals only", B: "Used as pesticides", C: "Given to healthy animals to promote growth", D: "Added to water supplies" }, correct: "C" },
      { id: "b2-04-q5", question: "How many people could die from resistant infections by 2050?", options: { A: "1 million", B: "5 million", C: "10 million", D: "20 million" }, correct: "C" },
    ],
  },
  {
    id: "b2-05",
    title: "Behavioral Economics",
    level: "B2", topic: "Economics", readTime: 5, wordCount: 175,
    content: `Traditional economics assumes that people are rational agents who make decisions to maximize their self-interest. Behavioral economics challenges this assumption, drawing on insights from psychology to understand how people actually make decisions.

Richard Thaler and Cass Sunstein introduced the concept of "nudging" — designing choice environments to steer people towards better decisions without restricting their freedom. For example, automatically enrolling employees in pension schemes dramatically increases participation rates.

Mental accounting refers to our tendency to treat money differently depending on its source or intended use. We might spend a windfall more freely than earned income, even though a dollar is a dollar regardless of its origin. Behavioral economics has had significant practical applications in public policy, healthcare, and financial planning.`,
    questions: [
      { id: "b2-05-q1", question: "What does traditional economics assume about people?", options: { A: "They are emotional", B: "They are irrational", C: "They are rational and self-interested", D: "They are altruistic" }, correct: "C" },
      { id: "b2-05-q2", question: "What is 'nudging'?", options: { A: "Forcing people to make good decisions", B: "Designing choices to steer people without restricting freedom", C: "Punishing bad financial decisions", D: "Restricting choices" }, correct: "B" },
      { id: "b2-05-q3", question: "What is an example of nudging mentioned?", options: { A: "Banning unhealthy food", B: "Mandatory savings", C: "Auto-enrolling employees in pensions", D: "Higher taxes on bad choices" }, correct: "C" },
      { id: "b2-05-q4", question: "What is mental accounting?", options: { A: "Counting money mentally", B: "Treating money differently based on its source", C: "Budgeting accurately", D: "Investing wisely" }, correct: "B" },
      { id: "b2-05-q5", question: "What is a windfall?", options: { A: "Earned income", B: "Money unexpectedly received", C: "A type of investment", D: "A tax refund specifically" }, correct: "B" },
    ],
  },
  {
    id: "b2-06",
    title: "The Psychology of Money",
    level: "B2", topic: "Psychology", readTime: 5, wordCount: 175,
    content: `Our relationship with money is often irrational and emotionally charged. Morgan Housel argues that doing well with money has little to do with intelligence and a lot to do with behavior.

We are prone to comparing our wealth with others, which drives consumption that outpaces income. We overestimate our future income and underestimate our future expenses, leading to insufficient saving. The hedonic treadmill describes our tendency to adapt rapidly to improvements in our circumstances, so that higher income or possessions do not produce lasting increases in happiness.

Research consistently shows that beyond a threshold of comfortable security, additional wealth contributes little to wellbeing. What matters most for financial happiness is freedom — having enough control over your time and choices.`,
    questions: [
      { id: "b2-06-q1", question: "According to Morgan Housel, what does financial success depend on?", options: { A: "Intelligence", B: "Luck", C: "Behavior", D: "Education" }, correct: "C" },
      { id: "b2-06-q2", question: "What is the hedonic treadmill?", options: { A: "A fitness concept", B: "Rapid adaptation to improvements in circumstances", C: "A type of investment", D: "Spending on luxury goods" }, correct: "B" },
      { id: "b2-06-q3", question: "What do we tend to underestimate?", options: { A: "Our income", B: "Our intelligence", C: "Our future expenses", D: "Our savings" }, correct: "C" },
      { id: "b2-06-q4", question: "Beyond what does additional wealth contribute little to wellbeing?", options: { A: "Extreme poverty", B: "A threshold of comfortable security", C: "Millionaire status", D: "Retirement age" }, correct: "B" },
      { id: "b2-06-q5", question: "What matters most for financial happiness?", options: { A: "Having the most wealth", B: "Owning property", C: "Freedom and control over time", D: "A high salary" }, correct: "C" },
    ],
  },
  {
    id: "b2-07",
    title: "Language and Identity",
    level: "B2", topic: "Culture", readTime: 5, wordCount: 178,
    content: `Language is intimately connected to identity — both personal and cultural. The language we speak shapes how we perceive and categorize the world. The Sapir-Whorf hypothesis proposes that the structure of a language affects its speakers' worldview.

Strong versions of this hypothesis are generally rejected, but evidence suggests that language does influence certain cognitive processes, such as color perception and spatial reasoning. For minority communities, language is often central to cultural identity and heritage.

The loss of a language represents the loss of a unique way of seeing the world. There are currently about 7,000 languages spoken in the world, but many are endangered. Linguists estimate that half of the world's languages could disappear by the end of this century as smaller languages are displaced by dominant global languages.`,
    questions: [
      { id: "b2-07-q1", question: "What does the Sapir-Whorf hypothesis propose?", options: { A: "All languages are equal", B: "Language structure affects worldview", C: "Language is unrelated to thought", D: "Languages evolve randomly" }, correct: "B" },
      { id: "b2-07-q2", question: "What cognitive processes does language influence?", options: { A: "Memory and reasoning only", B: "Nothing scientifically proven", C: "Color perception and spatial reasoning", D: "Mathematical ability" }, correct: "C" },
      { id: "b2-07-q3", question: "How many languages are currently spoken in the world?", options: { A: "About 3,000", B: "About 5,000", C: "About 7,000", D: "About 10,000" }, correct: "C" },
      { id: "b2-07-q4", question: "What fraction of languages might disappear this century?", options: { A: "One quarter", B: "Half", C: "One third", D: "Three quarters" }, correct: "B" },
      { id: "b2-07-q5", question: "What does the loss of a language represent?", options: { A: "Progress", B: "Loss of a unique way of seeing the world", C: "Increased efficiency", D: "Cultural advancement" }, correct: "B" },
    ],
  },
  {
    id: "b2-08",
    title: "The Microbiome",
    level: "B2", topic: "Science", readTime: 5, wordCount: 178,
    content: `The human body contains trillions of microorganisms — bacteria, viruses, fungi, and other organisms — collectively known as the microbiome. These microorganisms are not merely passengers but play essential roles in human health.

The gut microbiome influences digestion, immune function, and even mood and behavior through the gut-brain axis. Research has linked disruption of the gut microbiome — a condition called dysbiosis — to a wide range of conditions, including inflammatory bowel disease, obesity, and mental health disorders.

Diet is the most important factor shaping the gut microbiome. A diet rich in diverse plant foods promotes microbial diversity. Antibiotics, while essential for treating bacterial infections, can devastate the microbiome and should be used judiciously.`,
    questions: [
      { id: "b2-08-q1", question: "What is the microbiome?", options: { A: "A type of bacteria only", B: "Trillions of microorganisms in the human body", C: "A medical device", D: "A type of diet" }, correct: "B" },
      { id: "b2-08-q2", question: "What is dysbiosis?", options: { A: "A healthy microbiome", B: "Disruption of the gut microbiome", C: "A type of diet", D: "A digestive process" }, correct: "B" },
      { id: "b2-08-q3", question: "What is the gut-brain axis?", options: { A: "A type of nerve", B: "The connection between gut microbiome and mood/behavior", C: "A medical procedure", D: "A type of bacteria" }, correct: "B" },
      { id: "b2-08-q4", question: "What is the most important factor shaping the gut microbiome?", options: { A: "Exercise", B: "Sleep", C: "Diet", D: "Stress" }, correct: "C" },
      { id: "b2-08-q5", question: "What should antibiotics be used?", options: { A: "As often as possible", B: "Never", C: "Only for viral infections", D: "Judiciously" }, correct: "D" },
    ],
  },
  {
    id: "b2-09",
    title: "Democracy in the 21st Century",
    level: "B2", topic: "Politics", readTime: 5, wordCount: 178,
    content: `Democracy, broadly defined as government by and for the people, is widely considered the most legitimate form of political organization. Yet in recent years, democratic institutions have come under increasing pressure in many parts of the world.

Freedom House, which monitors political rights and civil liberties globally, has recorded consecutive years of decline in global democracy. Authoritarian governments have learned to use the mechanisms of democracy — elections, courts, and media — to legitimize their power while hollowing out democratic content.

In established democracies, rising inequality, political polarization, and declining trust in institutions pose challenges. Social media has simultaneously empowered citizens and created new vectors for disinformation. Strengthening democracy requires reinvigorating civic engagement, promoting media literacy, and reforming political institutions.`,
    questions: [
      { id: "b2-09-q1", question: "What does Freedom House monitor?", options: { A: "Economic growth", B: "Political rights and civil liberties", C: "Environmental conditions", D: "Military strength" }, correct: "B" },
      { id: "b2-09-q2", question: "How do authoritarian governments legitimize power?", options: { A: "Through military force only", B: "By using democratic mechanisms while hollowing out content", C: "By ignoring elections", D: "Through economic success" }, correct: "B" },
      { id: "b2-09-q3", question: "What poses challenges to established democracies?", options: { A: "Economic growth", B: "Technological advancement", C: "Rising inequality and polarization", D: "Increased voter turnout" }, correct: "C" },
      { id: "b2-09-q4", question: "What dual role has social media played?", options: { A: "Only negative", B: "Only positive", C: "Empowering citizens and spreading disinformation", D: "Neutral" }, correct: "C" },
      { id: "b2-09-q5", question: "What is needed to strengthen democracy?", options: { A: "More elections", B: "Media censorship", C: "Civic engagement and media literacy", D: "Stronger military" }, correct: "C" },
    ],
  },
  {
    id: "b2-10",
    title: "Biodiversity and Ecosystem Services",
    level: "B2", topic: "Environment", readTime: 5, wordCount: 178,
    content: `Biodiversity — the variety of life on Earth — provides essential services upon which human civilization depends. Ecosystem services encompass provisioning services such as food and fresh water; regulating services such as climate regulation and flood control; cultural services such as recreation; and supporting services such as soil formation.

The current rate of species extinction is estimated to be 100 to 1,000 times higher than the natural background rate, primarily due to habitat destruction, pollution, climate change, invasive species, and overexploitation. This "sixth mass extinction" threatens the stability of ecosystems.

Protecting biodiversity requires both conservation of natural habitats and a fundamental transformation of our economic systems to account for the value of ecosystem services.`,
    questions: [
      { id: "b2-10-q1", question: "What are 'provisioning services'?", options: { A: "Climate regulation services", B: "Food and fresh water provision", C: "Cultural and recreational services", D: "Soil formation" }, correct: "B" },
      { id: "b2-10-q2", question: "How much higher is the current extinction rate than the natural rate?", options: { A: "10-100 times", B: "100-1000 times", C: "1000-10000 times", D: "Twice as high" }, correct: "B" },
      { id: "b2-10-q3", question: "What is NOT mentioned as a cause of species extinction?", options: { A: "Habitat destruction", B: "Climate change", C: "Nuclear radiation", D: "Invasive species" }, correct: "C" },
      { id: "b2-10-q4", question: "What is the 'sixth mass extinction'?", options: { A: "A geological period", B: "The current dramatically high rate of extinction", C: "An ancient event", D: "A scientific theory" }, correct: "B" },
      { id: "b2-10-q5", question: "What is needed to protect biodiversity?", options: { A: "Only wildlife reserves", B: "Only changing economic systems", C: "Conservation and economic transformation", D: "Government regulations alone" }, correct: "C" },
    ],
  },

  // ─── C1 ───────────────────────────────────────────────────────────────────
  {
    id: "c1-01",
    title: "The Epistemology of Scientific Knowledge",
    level: "C1", topic: "Philosophy", readTime: 6, wordCount: 198,
    content: `The philosophical question of how science produces knowledge, and what confidence we should have in scientific theories, is more complex than popular conceptions suggest. Karl Popper's falsificationism holds that a scientific theory is distinguished from non-science by its susceptibility to being disproven by evidence. A good scientific theory makes bold, precise predictions that could in principle be false.

However, the philosopher W.V.O. Quine pointed out that it is never possible to test a single hypothesis in isolation — any hypothesis is tested in conjunction with auxiliary assumptions. When an experiment appears to falsify a theory, scientists may prefer to revise the auxiliary assumptions rather than the core theory.

Thomas Kuhn's concept of paradigms and scientific revolutions offers a sociological account of how science actually progresses, emphasizing the role of scientific communities and consensus in determining what counts as valid knowledge.`,
    questions: [
      { id: "c1-01-q1", question: "What is Popper's falsificationism?", options: { A: "Science must prove theories true", B: "Scientific theories must be susceptible to disproof", C: "All scientific theories are false", D: "Science requires consensus" }, correct: "B" },
      { id: "c1-01-q2", question: "What is Quine's objection to simple falsificationism?", options: { A: "Experiments are unreliable", B: "Hypotheses cannot be tested in isolation", C: "Scientists are biased", D: "Theories can never be proven" }, correct: "B" },
      { id: "c1-01-q3", question: "What are 'auxiliary assumptions'?", options: { A: "The core scientific theory", B: "Additional assumptions tested alongside a hypothesis", C: "Experimental equipment", D: "Scientific consensus" }, correct: "B" },
      { id: "c1-01-q4", question: "What is Kuhn's concept of 'paradigms'?", options: { A: "Mathematical models", B: "Experimental methods", C: "Dominant frameworks shaping scientific consensus", D: "Individual theories" }, correct: "C" },
      { id: "c1-01-q5", question: "What does Kuhn emphasize in scientific progress?", options: { A: "Individual genius", B: "Experimental accuracy", C: "The role of scientific communities and consensus", D: "Mathematical proof" }, correct: "C" },
    ],
  },
  {
    id: "c1-02",
    title: "Cognitive Biases and Epistemic Humility",
    level: "C1", topic: "Psychology", readTime: 6, wordCount: 195,
    content: `The Dunning-Kruger effect describes the tendency of people with limited knowledge in a domain to overestimate their own competence. Paradoxically, as genuine expertise develops, individuals often become more aware of the limits of their knowledge — a phenomenon encapsulated in the Socratic maxim "I know that I know nothing."

This epistemic humility is not merely a psychological curiosity but has profound implications for epistemology and rational discourse. Metacognition — the capacity to reflect on and regulate one's own cognitive processes — is a precondition for accurate self-assessment. Research indicates that training in critical thinking and exposure to diverse perspectives can partially mitigate overconfidence.

The implications extend to collective decision-making. Organizations and democracies that create structures encouraging dissent, welcoming challenge to established views, and rewarding intellectual humility tend to make better decisions than those that valorize certainty and punish doubt.`,
    questions: [
      { id: "c1-02-q1", question: "What is the Dunning-Kruger effect?", options: { A: "Experts overestimating their ability", B: "Limited knowledge leading to overestimation of competence", C: "Accurate self-assessment by novices", D: "The decline of expertise with age" }, correct: "B" },
      { id: "c1-02-q2", question: "What happens to self-assessment as genuine expertise develops?", options: { A: "Overconfidence increases", B: "Self-assessment remains constant", C: "Awareness of knowledge limits increases", D: "Expertise becomes irrelevant" }, correct: "C" },
      { id: "c1-02-q3", question: "What is metacognition?", options: { A: "Thinking about external problems", B: "Reflecting on and regulating one's cognitive processes", C: "A type of memory", D: "A learning strategy" }, correct: "B" },
      { id: "c1-02-q4", question: "What can partially mitigate overconfidence?", options: { A: "More education in one subject", B: "Critical thinking training and diverse perspectives", C: "Avoiding difficult problems", D: "Relying on experts" }, correct: "B" },
      { id: "c1-02-q5", question: "What makes organizations better at decision-making?", options: { A: "Strong leadership", B: "Punishing doubt", C: "Valuing certainty", D: "Encouraging dissent and intellectual humility" }, correct: "D" },
    ],
  },
  {
    id: "c1-03",
    title: "The Architecture of Power",
    level: "C1", topic: "Philosophy", readTime: 6, wordCount: 198,
    content: `The relationship between spatial organization and social power has been a persistent theme in critical theory. Michel Foucault's analysis of the panopticon — Jeremy Bentham's 18th-century prison design in which inmates could be observed at any time without knowing whether they were actually being watched — has become emblematic of modern disciplinary power.

Constant potential surveillance induces self-regulation, making external coercion less necessary. Foucault generalized this analysis to hospitals, schools, and factories, arguing that modern institutions exercise power through spatial organization and surveillance.

Architecture is never politically neutral. The layout of a city, the design of public spaces, and the architecture of institutions reflect and reproduce social hierarchies. Urban planning has been used to segregate populations, facilitate surveillance, and exclude marginalized groups from public space.`,
    questions: [
      { id: "c1-03-q1", question: "What is the panopticon?", options: { A: "A type of surveillance camera", B: "A prison design allowing observation without being seen", C: "A political theory", D: "A type of architecture style" }, correct: "B" },
      { id: "c1-03-q2", question: "What does constant potential surveillance induce?", options: { A: "Rebellion", B: "Indifference", C: "Self-regulation", D: "Cooperation" }, correct: "C" },
      { id: "c1-03-q3", question: "To which institutions did Foucault extend his analysis?", options: { A: "Only prisons", B: "Hospitals, schools, and factories", C: "Military institutions only", D: "Religious institutions" }, correct: "B" },
      { id: "c1-03-q4", question: "According to the article, what is architecture?", options: { A: "Purely aesthetic", B: "Politically neutral", C: "Never politically neutral", D: "Only functional" }, correct: "C" },
      { id: "c1-03-q5", question: "How has urban planning been misused?", options: { A: "To provide parks", B: "To create public spaces", C: "To connect communities", D: "To segregate populations and exclude marginalized groups" }, correct: "D" },
    ],
  },
  {
    id: "c1-04",
    title: "The Limits of Economic Growth",
    level: "C1", topic: "Economics", readTime: 6, wordCount: 198,
    content: `The assumption that economic growth is an unqualified good — that more GDP per capita invariably means better human welfare — has been increasingly challenged from multiple directions. Beyond a certain level of material sufficiency, research suggests that additional income produces diminishing returns to subjective wellbeing.

The Easterlin paradox notes that while wealthier individuals report higher wellbeing than poorer ones within a given country, countries as a whole do not become happier as they grow richer over time. Environmental economists argue that infinite growth is incompatible with finite planetary resources.

The "doughnut economics" framework, developed by Kate Raworth, proposes that the goal of economics should be to meet the needs of all people within the means of the living planet — a safe and just space for humanity that avoids both social deprivation and ecological overshoot.`,
    questions: [
      { id: "c1-04-q1", question: "What is the Easterlin paradox?", options: { A: "Wealthy nations are always happier", B: "Countries don't become happier as they grow richer overall", C: "Individual wealth increases happiness indefinitely", D: "Economic growth is always positive" }, correct: "B" },
      { id: "c1-04-q2", question: "What does 'diminishing returns to wellbeing' mean?", options: { A: "Less money leads to more happiness", B: "Additional income beyond sufficiency adds little happiness", C: "Wellbeing decreases with wealth", D: "Money always increases happiness" }, correct: "B" },
      { id: "c1-04-q3", question: "What do environmental economists argue about growth?", options: { A: "Growth is always sustainable", B: "Growth improves the environment", C: "Infinite growth is incompatible with finite resources", D: "Growth is necessary for environmental protection" }, correct: "C" },
      { id: "c1-04-q4", question: "Who developed doughnut economics?", options: { A: "Thomas Piketty", B: "Kate Raworth", C: "Milton Friedman", D: "John Maynard Keynes" }, correct: "B" },
      { id: "c1-04-q5", question: "What does doughnut economics aim to avoid?", options: { A: "Both social deprivation and ecological overshoot", B: "Economic growth", C: "Technological development", D: "International trade" }, correct: "A" },
    ],
  },
  {
    id: "c1-05",
    title: "Metacognition and Learning",
    level: "C1", topic: "Education", readTime: 6, wordCount: 198,
    content: `Metacognition — thinking about thinking — is increasingly recognized as one of the most important skills for effective learning. It encompasses the ability to monitor one's own understanding, identify gaps in knowledge, select appropriate learning strategies, and regulate one's cognitive processes.

Research by John Flavell in the 1970s established metacognition as a distinct area of psychological inquiry. Subsequent decades of research have demonstrated that metacognitive skills are strong predictors of academic achievement, independent of general intelligence.

Poor learners often overestimate their own understanding — a phenomenon known as the Dunning-Kruger effect — and consequently fail to engage in remedial study. Effective metacognitive strategies include elaborative interrogation, self-explanation, interleaving different subjects during study, and spaced retrieval practice. Teaching these strategies explicitly significantly improves learning outcomes.`,
    questions: [
      { id: "c1-05-q1", question: "What is metacognition?", options: { A: "Learning from others", B: "Thinking about one's own thinking and learning", C: "A type of memory", D: "Critical analysis of texts" }, correct: "B" },
      { id: "c1-05-q2", question: "Who established metacognition as a research area?", options: { A: "Piaget", B: "Vygotsky", C: "John Flavell", D: "Chomsky" }, correct: "C" },
      { id: "c1-05-q3", question: "What predicts academic achievement independently of intelligence?", options: { A: "Study hours", B: "Natural talent", C: "Metacognitive skills", D: "Motivation alone" }, correct: "C" },
      { id: "c1-05-q4", question: "What is 'spaced retrieval practice'?", options: { A: "Studying one subject continuously", B: "Testing memory at spaced intervals", C: "Reading the same material repeatedly", D: "Studying just before exams" }, correct: "B" },
      { id: "c1-05-q5", question: "What mistake do poor learners often make?", options: { A: "Studying too hard", B: "Overestimating their own understanding", C: "Asking too many questions", D: "Being too self-critical" }, correct: "B" },
    ],
  },
  {
    id: "c1-06",
    title: "Narrative Identity",
    level: "C1", topic: "Psychology", readTime: 6, wordCount: 198,
    content: `The philosopher Paul Ricoeur proposed that human identity is fundamentally narrative in character. We understand ourselves and others through stories — by organizing events into a coherent temporal sequence with a beginning, middle, and end.

On this account, personal identity over time is not guaranteed by physical or psychological continuity alone, but requires the construction of a narrative that integrates past experiences, present circumstances, and future projects into a meaningful whole. This narrative self is not static but continually revised in light of new experiences.

Psychologists have found empirical support for narrative identity theory, demonstrating that the stories people tell about their lives — particularly how they make sense of challenging experiences — predict wellbeing, resilience, and psychological growth. The therapeutic potential of narrative is exploited in narrative therapy and memoir writing.`,
    questions: [
      { id: "c1-06-q1", question: "What did Paul Ricoeur propose about human identity?", options: { A: "Identity is fixed at birth", B: "Identity is fundamentally narrative", C: "Identity is purely physical", D: "Identity is determined by genetics" }, correct: "B" },
      { id: "c1-06-q2", question: "What is the narrative self according to Ricoeur?", options: { A: "A fixed, unchanging self", B: "A self continually revised through experience", C: "Only our memories", D: "Our social roles" }, correct: "B" },
      { id: "c1-06-q3", question: "What do stories about challenging experiences predict?", options: { A: "Academic success", B: "Financial outcomes", C: "Wellbeing, resilience, and growth", D: "Social popularity" }, correct: "C" },
      { id: "c1-06-q4", question: "What practical application of narrative is mentioned?", options: { A: "Historical research", B: "Legal documentation", C: "Narrative therapy and memoir writing", D: "Literary criticism" }, correct: "C" },
      { id: "c1-06-q5", question: "What is NOT sufficient alone for personal identity over time?", options: { A: "Narrative construction", B: "Physical continuity alone", C: "Integration of experiences", D: "Future projects" }, correct: "B" },
    ],
  },
  {
    id: "c1-07",
    title: "The Political Economy of Inequality",
    level: "C1", topic: "Economics", readTime: 6, wordCount: 198,
    content: `The relationship between economic growth and inequality is one of the most contested questions in contemporary political economy. The Kuznets curve hypothesis predicted that inequality would initially rise and then fall as economies developed, suggesting growth would eventually solve inequality. This optimistic prediction has not been borne out.

Since the 1980s, inequality has risen sharply in most developed countries, driven by technological change, globalization, financialization, declining union power, and deliberate policy choices such as tax cuts and deregulation.

Thomas Piketty's influential analysis argues that when the rate of return on capital exceeds the rate of economic growth — a condition that prevailed throughout most of history — wealth tends to concentrate. Addressing extreme inequality requires a comprehensive set of policies extending well beyond traditional redistribution.`,
    questions: [
      { id: "c1-07-q1", question: "What does the Kuznets curve hypothesis predict?", options: { A: "Inequality always rises with growth", B: "Inequality rises then falls as economies develop", C: "Inequality has no relation to growth", D: "Inequality only affects poor countries" }, correct: "B" },
      { id: "c1-07-q2", question: "Has the Kuznets curve prediction been confirmed?", options: { A: "Yes, completely", B: "Partially", C: "No, it has not been borne out", D: "It is still being tested" }, correct: "C" },
      { id: "c1-07-q3", question: "What is 'financialization' in context?", options: { A: "Government spending", B: "The growing dominance of finance in the economy", C: "Banking regulation", D: "Tax collection" }, correct: "B" },
      { id: "c1-07-q4", question: "What is Piketty's key argument?", options: { A: "Growth always reduces inequality", B: "When return on capital exceeds growth, wealth concentrates", C: "Redistribution is the only solution", D: "Technology drives equality" }, correct: "B" },
      { id: "c1-07-q5", question: "What is needed to address extreme inequality?", options: { A: "Only tax cuts", B: "Only redistribution", C: "Comprehensive policies beyond redistribution", D: "Economic growth alone" }, correct: "C" },
    ],
  },
  {
    id: "c1-08",
    title: "The Anthropocene",
    level: "C1", topic: "Environment", readTime: 6, wordCount: 198,
    content: `Geologists have proposed that we have entered a new geological epoch — the Anthropocene — defined by the dominant influence of human activity on Earth's geology and ecosystems. While the exact start date is debated, there is broad scientific consensus that human activities have fundamentally altered the planet's systems.

The evidence is pervasive: the global spread of radioactive isotopes from nuclear testing, the worldwide presence of microplastics, dramatic increases in reactive nitrogen from synthetic fertilizers, the sixth mass extinction event, and the acceleration of climate change.

The concept of the Anthropocene has implications beyond geology. It challenges the boundaries between nature and culture, raises questions about human responsibility for the planet's future, and forces a reckoning with the consequences of industrial civilization.`,
    questions: [
      { id: "c1-08-q1", question: "What defines the Anthropocene epoch?", options: { A: "The discovery of new species", B: "Human activity's dominant influence on Earth", C: "A major geological event", D: "The ice age ending" }, correct: "B" },
      { id: "c1-08-q2", question: "What is NOT mentioned as evidence for the Anthropocene?", options: { A: "Microplastics worldwide", B: "Mass extinction", C: "Ozone layer recovery", D: "Radioactive isotopes from nuclear testing" }, correct: "C" },
      { id: "c1-08-q3", question: "What boundary does the Anthropocene challenge?", options: { A: "Between developed and developing nations", B: "Between nature and culture", C: "Between science and religion", D: "Between past and present" }, correct: "B" },
      { id: "c1-08-q4", question: "What does reactive nitrogen in the environment come from?", options: { A: "Nuclear testing", B: "Ocean pollution", C: "Synthetic fertilizers", D: "Air travel" }, correct: "C" },
      { id: "c1-08-q5", question: "What must industrial civilization reckon with?", options: { A: "Its economic success", B: "Its technological achievements", C: "The consequences of its activities", D: "Its cultural contributions" }, correct: "C" },
    ],
  },
  {
    id: "c1-09",
    title: "The Philosophy of Free Will",
    level: "C1", topic: "Philosophy", readTime: 6, wordCount: 198,
    content: `The question of whether human beings possess genuine free will is one of the most profound in philosophy. Determinism holds that every event, including every human thought and action, is the inevitable result of prior causes governed by the laws of nature.

Compatibilists argue that free will and determinism are not contradictory. What matters for free will is not whether our actions are caused, but whether they are caused in the right way — by our own desires, values, and deliberation rather than by external compulsion. Hard incompatibilists reject this response, arguing that if determinism is true, moral responsibility is impossible.

Recent neuroscience adds complexity: studies suggest that brain activity predicting a decision precedes our conscious awareness of deciding, raising questions about the role of conscious will in human action.`,
    questions: [
      { id: "c1-09-q1", question: "What does determinism hold?", options: { A: "All events are random", B: "Humans have complete freedom", C: "Every event is the result of prior causes", D: "Consciousness creates reality" }, correct: "C" },
      { id: "c1-09-q2", question: "What is the compatibilist position?", options: { A: "Free will and determinism are incompatible", B: "Free will and determinism are not contradictory", C: "Determinism is false", D: "Free will is an illusion" }, correct: "B" },
      { id: "c1-09-q3", question: "What do hard incompatibilists argue?", options: { A: "Free will exists independently", B: "Moral responsibility is possible despite determinism", C: "If determinism is true, moral responsibility is impossible", D: "Consciousness proves free will" }, correct: "C" },
      { id: "c1-09-q4", question: "What do neuroscience studies suggest about decisions?", options: { A: "Consciousness fully controls decisions", B: "Brain activity predicting decisions precedes conscious awareness", C: "The brain has no role in decisions", D: "Decisions are always conscious" }, correct: "B" },
      { id: "c1-09-q5", question: "According to compatibilists, what matters for free will?", options: { A: "That actions are completely uncaused", B: "The social context of actions", C: "That actions are caused by own desires and deliberation", D: "That actions defy physics" }, correct: "C" },
    ],
  },
  {
    id: "c1-10",
    title: "The Digital Transformation of Democracy",
    level: "C1", topic: "Politics", readTime: 6, wordCount: 198,
    content: `The internet and social media have transformed the conditions of democratic politics in ways whose consequences remain profoundly uncertain. On the optimistic view, digital technologies have lowered the costs of political organizing, enabled new forms of collective action, and given voice to previously marginalized groups.

More sober assessments have followed. The algorithmic amplification of emotionally resonant, often outrage-inducing content creates filter bubbles and polarizes political discourse. Disinformation — false or misleading information deliberately spread to deceive — has proliferated across digital platforms.

State and non-state actors have used social media to manipulate public opinion. The business models of dominant technology platforms create systematic incentives that appear incompatible with the informational requirements of democratic deliberation, prioritizing engagement over accuracy and nuance.`,
    questions: [
      { id: "c1-10-q1", question: "What is an optimistic view of digital democracy?", options: { A: "Social media increases polarization", B: "Digital tools lower costs of political organizing", C: "Algorithms improve information quality", D: "Technology reduces participation" }, correct: "B" },
      { id: "c1-10-q2", question: "What are 'filter bubbles'?", options: { A: "Secure online spaces", B: "Information environments reinforcing existing views", C: "Types of social media", D: "Political parties' websites" }, correct: "B" },
      { id: "c1-10-q3", question: "What is disinformation?", options: { A: "Lack of information", B: "Complex information", C: "False information spread accidentally", D: "False information deliberately spread to deceive" }, correct: "D" },
      { id: "c1-10-q4", question: "What do technology platform business models prioritize?", options: { A: "Accuracy and nuance", B: "Democratic deliberation", C: "Engagement over accuracy", D: "User privacy" }, correct: "C" },
      { id: "c1-10-q5", question: "What was the Arab Spring cited as?", options: { A: "Evidence of disinformation", B: "A failure of social media", C: "A demonstration of social media's democratizing potential", D: "An example of foreign interference" }, correct: "C" },
    ],
  },
];
