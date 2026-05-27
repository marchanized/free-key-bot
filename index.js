const {
  Client,
  GatewayIntentBits,
  Events
} = require("discord.js");

const {
  createClient
} = require("@supabase/supabase-js");

// ======================
// ENV VARIABLES
// ======================

const TOKEN =
process.env.TOKEN;

const SUPABASE_URL =
"https://vdnagbhbufgwvkdlgrgp.supabase.co";

const SUPABASE_KEY =
process.env.SUPABASE_KEY;

// ======================
// SUPABASE
// ======================

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ======================
// DISCORD CLIENT
// ======================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// ======================
// READY EVENT
// ======================

client.once(
  Events.ClientReady,
  async () => {

    console.log(
      `✅ Logged in as ${client.user.tag}`
    );

    try {

      // CHANNEL
      const channel =
      await client.channels.fetch(
        "1509039029994262580"
      );

      // CHECK EXISTING BUTTON
      const messages =
      await channel.messages.fetch({
        limit: 20
      });

      const existing =
      messages.find(
        m =>
        m.author.id === client.user.id &&
        m.content.includes(
          "FREE 12-hour key"
        )
      );

      // SEND ONLY ONCE
      if (!existing) {

        await channel.send({
          content:
          "🎁 Click below to claim your FREE 12-hour key!",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 3,
                  label: "CLAIM FREE KEY",
                  custom_id: "claim_free"
                }
              ]
            }
          ]
        });

        console.log(
          "✅ Free key button sent."
        );

      } else {

        console.log(
          "✅ Button already exists."
        );

      }

    } catch (err) {

      console.error(
        "❌ Channel Error:",
        err
      );

    }

  }
);

// ======================
// BUTTON INTERACTION
// ======================

client.on(
  Events.InteractionCreate,
  async interaction => {

    if (!interaction.isButton()) return;

    if (
      interaction.customId !==
      "claim_free"
    ) return;

    try {

      const discordId =
      interaction.user.id;

      // ======================
      // CHECK PREVIOUS CLAIM
      // ======================

      const {
        data: existingClaim,
        error: claimError
      } = await supabase
      .from("DISCORD_FREE_CLAIMS")
      .select("*")
      .eq(
        "discord_id",
        discordId
      );

      if (claimError) {

        console.log(claimError);

        return interaction.reply({
          content:
          "❌ Database error.",
          ephemeral: true
        });

      }

      // ======================
      // ALREADY CLAIMED
      // ======================

      if (
        existingClaim &&
        existingClaim.length > 0
      ) {

        return interaction.reply({
          content:
          "❌ You already claimed a FREE key before!\n\n🛒 Want permanent access?\nPurchase here for only $4.99:\nhttps://marchie.mysellauth.com/product/auto-farm-chests-bridger-western",
          ephemeral: true
        });

      }

      // ======================
      // GET UNUSED FREE KEY
      // ======================

      const {
        data: freeKeys,
        error: keyError
      } = await supabase
      .from("KEYS")
      .select("*")
      .like("key", "FREE-%")
      .eq("active", true)
      .is(
        "activated_at",
        null
      )
      .limit(1);

      if (keyError) {

        console.log(keyError);

        return interaction.reply({
          content:
          "❌ Failed fetching free keys.",
          ephemeral: true
        });

      }

      if (
        !freeKeys ||
        freeKeys.length === 0
      ) {

        return interaction.reply({
          content:
          "❌ No FREE keys available right now.",
          ephemeral: true
        });

      }

      const keyData =
      freeKeys[0];

      // ======================
      // SAVE CLAIM
      // ======================

      await supabase
      .from("DISCORD_FREE_CLAIMS")
      .insert({
        discord_id:
        discordId
      });

      // ======================
      // SEND DM
      // ======================

      await interaction.user.send(
`🎁 Your FREE 12-Hour Key:

${keyData.key}

Loader:

\`\`\`lua
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
\`\`\`
`
      );

      // ======================
      // SUCCESS
      // ======================

      await interaction.reply({
        content:
        "✅ FREE key sent to your DMs!",
        ephemeral: true
      });

      console.log(
        `✅ ${interaction.user.tag} claimed a FREE key.`
      );

    } catch (err) {

      console.error(
        "❌ Interaction Error:",
        err
      );

      if (!interaction.replied) {

        await interaction.reply({
          content:
          "❌ Something went wrong.",
          ephemeral: true
        });

      }

    }

  }
);

// ======================
// LOGIN
// ======================

client.login(TOKEN);
