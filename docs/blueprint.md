# **App Name**: ClosetPilot

## Core Features:

- User Authentication (Simulated): A login screen with Email and Password inputs; clicking 'Log In' toggles the isLoggedIn state, granting access to the main application without actual authentication.
- Mobile-First Navigation: A fixed bottom navigation bar with 'Closet', 'Styler', and 'Trip Kit' tabs, allowing users to switch between main sections. The active tab is highlighted.
- Digital Closet Management: A grid-based display of clothing items from the user's active inventory, with item name, price, and descriptive tag pills. Includes a search/filter bar for categories.
- AI-Powered Item Cataloging Tool (Simulated): A floating action button that triggers a simulated camera modal. After a 'shutter' click, it displays an 'AI Scanning & Tagging...' spinner and then closes, adding a new item to the closet.
- AI Style Generation Tool: Allows users to input an occasion and generates curated outfit suggestions, displaying clothing cards (Top, Bottom, Footwear), a match percentage, and an 'AI Rationale' for the selections.
- AI Travel Packing Tool: Users input a destination and travel dates to receive a weather alert and two carousels ('Must Have', 'Nice to Have') with AI-generated packing suggestions, complete with pagination.

## Style Guidelines:

- Primary color: A vibrant, clear blue (#2563EB) for interactive elements like buttons and active navigation tabs, evoking a sense of modernity and trust. This directly matches the requested CTA blue.
- Background color: A subtle, desaturated blue-gray (#EDF0F5), providing a clean, spacious backdrop that keeps the interface light and minimizes visual distraction.
- Accent color: A soft, cool cyan-blue (#93D3E9) to subtly highlight secondary actions or less prominent details, analogous to the primary while maintaining differentiation and balance.
- Logo and bold text color: A deep, rich indigo blue (#0B2545) to create a strong, authoritative presence for the brand logo and critical text, as specified in the logo requirements.
- Body and headline font: 'Inter' (sans-serif), chosen for its excellent readability across different screen sizes and its modern, neutral aesthetic, which supports a sleek and professional user interface.
- All icons are sourced from 'lucide-react' to maintain visual consistency and align with the modern, clean design aesthetic throughout the application.
- Mobile-first design with content constrained to a max-width-md, ensuring optimal viewing and interaction on mobile devices. Key components like the navigation bar are absolutely positioned at the bottom.
- The Closet screen utilizes a responsive 2-column CSS Grid for efficient display of clothing items, enhancing browsability and visual balance.
- Modals, such as the simulated camera view, use full-screen dark overlays to provide a focused user experience for specific interactions, like adding new items.
- Interactive elements, such as buttons and navigation tabs, feature subtle active/hover states to provide tactile feedback and a premium feel. Loading states, like AI scanning and content generation, are communicated through simulated 1.5-second spinners and toast notifications.