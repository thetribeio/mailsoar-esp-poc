import { config as loadEnv } from "dotenv";

const fetchActiveCampaignApi = async <T>(path: string): Promise<T> => {
    const response = await fetch(`${process.env.ACTIVE_CAMPAIGN_API_URL}/api/3/${path}`, {
        headers: [
            ["Api-Token", process.env.ACTIVE_CAMPAIGN_API_KEY!],
        ]
    });

    return response.json();
};

type Message = {
    id: string,
    name: string,
    userid: string,
};

type MessagesApiResponse = {
    messages: Message[];
};

const listAllMessages = async (): Promise<Message[]> => {
    const { messages }: MessagesApiResponse = await fetchActiveCampaignApi("messages");

    return messages;
}

type MessageDetails = {
    id: string,
    subject: string,
    fromname: string,
    fromemail: string,
    text: string,
}

type GetMessageApiResponse = {
    message: MessageDetails,
};

const getMessageDetails = async (messageId: string): Promise<GetMessageApiResponse> => {
    return fetchActiveCampaignApi(`messages/${messageId}`);
};

const listAllCampaigns = async (): Promise<{ campaigns: { id: string } }> => {
    return fetchActiveCampaignApi("campaigns");
}

const getCampaign = async (id: string): Promise<{
    campaign: {
        created_timestamp: string,
        uniqueopens: string,
        unsubscribes: string,
    }
}> => {
    return fetchActiveCampaignApi(`campaigns/${id}`);
};

const mainActiveCampaign = async () => {
    console.log("[ActiveCampaign] Fetching all messages...");
    const messages = await listAllMessages();
    const messagesDetails: GetMessageApiResponse[] = await Promise.all(messages.map((m => getMessageDetails(m.id))));

    messagesDetails.forEach(details => {
        const { message } = details;
        const { id, subject, fromname, fromemail, text } = message;

        console.log(`[ActiveCampaign] - id ${id}, from ${fromname}, subject "${subject}"`);
    });

    console.log("[ActiveCampaign] Fetching all campaigns...");
    const data = await listAllCampaigns();
    const { campaigns } = data;
    const campaign = campaigns[0];

    console.log(`[ActiveCampaign] Fetching campaign with id ${campaign.id}`);
    const { campaign: details } = await getCampaign(campaign.id);
    const { created_timestamp, uniqueopens, unsubscribes } = details;
    console.log(`[ActiveCampaign] Timestamp ${created_timestamp}, opens ${uniqueopens}, unsubscribes ${unsubscribes}`);
};

const fetchBeehiivApi = async <T>(path: string) => {
    const response = await fetch(`${process.env.BEEHIIV_API_URL}/${path}`, {
        headers: [
            ["Authorization", `Bearer ${process.env.BEEHIIV_API_KEY}`],
        ]
    });

    return response.json();
};

const listPublications = async () => {
    const { data: publications } = await fetchBeehiivApi("publications");

    return publications;
}

const getPublication = async (id: string) => {
    return fetchBeehiivApi(`publications/${id}?expand=stats`);
}

const mainBeehiiv = async () => {
    console.log("[Beehiiv] Listing publications...");
    const publications = await listPublications();
    const publicationDetails = await Promise.all(publications.map(p => getPublication(p.id)));

    publicationDetails.forEach(details => {
        const { data } = details;
        const { id, stats } = data;
        const { total_sent, total_unique_opened } = stats;

        console.log(`[Beehiiv] Publication id ${id}, total_sent ${total_sent}, total_unique_opened ${total_unique_opened}`);
    })
};

(async () => {
    loadEnv();

    await mainActiveCampaign();
    await mainBeehiiv();
})();
