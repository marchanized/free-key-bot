const {
  Client,
  GatewayIntentBits,
  Events
} = require("discord.js");

const {
  createClient
} = require("@supabase/supabase-js");

// TOKENS FROM RAILWAY VARIABLES
const TOKEN = process.env.TOKEN;

const SUPABASE_URL =
"https://vdnagbhbufgwvkdlgrgp.supabase.co";

const SUPABASE_KEY =
process.env.SUPABASE_KEY;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// DISCORD CLIENT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

// BOT READY
client.once(Events.ClientReady, async () => {

  console.log(`Logged in as ${client.user.tag}`);

});

// BUTTON INTERACTION
client.on(
  Events.InteractionCreate,
  async interaction => {

    if (!interaction.isButton()) return;

    if (interaction.customId === "claim_free") {

      const discordId = interaction.user.id;

      // CHECK IF USER ALREADY CLAIMED
      const {
        data: existingClaim
      } = await supabase
      .from("DISCORD_FREE_CLAIMS")
      .select("*")
      .eq("discord_id", discordId);

      if (existingClaim.length) {

        return interaction.reply({
          content:
          "❌ You already claimed a FREE key before!",
          ephemeral: true
        });

      }

      // GET UNUSED FREE KEY
      const {
        data: freeKeys
      } = await supabase
      .from("KEYS")
      .select("*")
      .like("key", "FREE-%")
      .eq("active", true)
      .is("activated_at", null)
      .limit(1);

      if (!freeKeys.length) {

        return interaction.reply({
          content:
          "❌ No FREE keys available right now.",
          ephemeral: true
        });

      }

      const keyData = freeKeys[0];

      // SAVE CLAIM
      await supabase
      .from("DISCORD_FREE_CLAIMS")
      .insert({
        discord_id: discordId
      });

      // SEND DM
      await interaction.user.send(
`🎁 Your FREE 12-Hour Key:

${keyData.key}

Loader:

local key = "${keyData.key}"

local hwid =
game:GetService("RbxAnalyticsService"):GetClientId()

local response = game:HttpGet(
"https://jolly-boat-8d1f.marchancreatives.workers.dev/?key="
.. key ..
"&hwid=" .. hwid
)

if response:find("error") then

game:GetService("StarterGui"):SetCore(
"SendNotification",
{
Title = "Authentication",
Text = response,
Duration = 8
}
)

return
end

loadstring(response)()
`
      );

      // SUCCESS MESSAGE
      await interaction.reply({
        content:
        "✅ FREE key sent to your DMs!",
        ephemeral: true
      });

    }

  }
);

// LOGIN
client.login(TOKEN);
