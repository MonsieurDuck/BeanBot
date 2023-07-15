const { default: axios } = require('axios');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const twitch = require('axios').default;
twitch.defaults.baseURL = 'https://api.twitch.tv/helix'
twitch.defaults.headers.common['Authorization'] = 'Bearer pm2cmmnxkw0oxpvhbbrzyy8xisccy0';
twitch.defaults.headers.common['Client-id'] = '6oqct6k04iuw0ssjlrt4ejurhodcbz';
const {readFileSync, promises: fsPromises} = require('fs');
const streamerNamesFile = "./resources/streamerNames.txt";
const STREAMS = "Streams";
const USERS = "Users";
const TWITCH_URL_BASE = 'https://twitch.tv/';
const HEIGHT= '288';
const WIDTH = '512';


function syncReadFile(filename) {
	const contents = readFileSync(filename, 'utf-8');
	const arr = contents.split(/\r?\n/);
	return arr;
}

function parseStreamerNameArray(streamerArray, typeOfGetCall) {
    let returnString;
    switch (typeOfGetCall) {
        case STREAMS:
            returnString = "/streams";
                if (streamerArray.length != 0) {
                    for (let streamer of streamerArray) {
                        if (streamer == streamerArray[0]) {
                            returnString += "?user_login=" + streamer;
                        } else {
                            returnString += "&user_login=" + streamer;
                        }
                    }
                }
            break;
        case USERS:
            returnString = "/users";
                if (streamerArray.length != 0) {
                    for (let streamer of streamerArray) {
                        if (streamer == streamerArray[0]) {
                            returnString += "?login=" + streamer;
                        } else {
                            returnString += "&login=" + streamer;
                        }
                    }
                }
 
        }
    return returnString;
}

async function getStreamData(typeOfGetCall){
    const streamerNameArray = syncReadFile(streamerNamesFile);
    const URLParamString = parseStreamerNameArray(streamerNameArray, typeOfGetCall);
    const liveResult = await axios.get(URLParamString);
    return liveResult.data.data;
}

function buildEmbedArray(streamerData, userData) {
    let embedArray = [];
    for (let stream of streamerData) {

        const user = getRelevantUser(stream, userData);
        const streamThumbnail = stream.thumbnail_url.replace("{width}", WIDTH).replace("{height}", HEIGHT);

        const embed = new EmbedBuilder()
        .setColor(0xA020F0)
        .setTitle(stream.title)
        .setURL(TWITCH_URL_BASE + user.login)
        .setAuthor ({
            name: user.display_name + " is live right now!",
            iconURL: user.profile_image_url,
            url: TWITCH_URL_BASE + user.login
        })
        .setDescription(user.description)
        .setThumbnail(user.profile_image_url)
        .addFields(
            {name: 'Category', value: stream.game_name, inline: true},
            {name: 'Started at', value: stream.started_at, inline: true}
        )
        .setImage(streamThumbnail)
        .setTimestamp()
        .setFooter({ text: 'BeanBot made by Dunstan Wang', iconURL: user.profile_image_url});

        embedArray.push(embed);
    }
    return embedArray;
}

function getRelevantUser(streamer, userData) {
    for (let user of userData) {
        if (streamer.user_login == user.login) {
            return user;
        }
    }
    console.error("missing user");
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('live')
		.setDescription('Shows who is live in Beans'),
	async execute(interaction) {
        await interaction.deferReply();
        const liveStreamerData = await getStreamData(STREAMS);
        const liveUserData = await getStreamData(USERS);
        const embedArray = buildEmbedArray(liveStreamerData, liveUserData);

        for (let embed of embedArray) {
            if (embed === embedArray[0]) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.followUp({ embeds: [embed] });
            }
                
        }
	},
}; 